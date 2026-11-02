<?php

use App\Models\Booking;

/** A valid payload; override any field per test. */
function bookingPayload(array $overrides = []): array
{
    return array_merge([
        'customer_name' => 'Sam Carter',
        'customer_email' => 'sam@example.com',
        'rego' => 'abc 123',
        'service_bay' => 2,
        'starts_at' => '2027-03-01T09:00:00+10:00',
        'ends_at' => '2027-03-01T11:00:00+10:00',
        'notes' => 'Gas check and brake service',
    ], $overrides);
}

function makeBooking(array $overrides = []): Booking
{
    return Booking::create(array_merge(bookingPayload(), ['status' => 'confirmed'], $overrides));
}

describe('create and read', function () {
    it('creates a pending booking and normalises the rego', function () {
        $this->postJson('/api/bookings', bookingPayload())
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.rego', 'ABC 123');

        expect(Booking::count())->toBe(1);
    });

    it('shows a booking and returns a JSON 404 when it does not exist', function () {
        $booking = makeBooking();

        $this->getJson("/api/bookings/{$booking->id}")->assertOk()->assertJsonPath('data.id', $booking->id);
        $this->getJson('/api/bookings/999')->assertNotFound();
    });

    it('updates and deletes a booking', function () {
        $booking = makeBooking();

        $this->patchJson("/api/bookings/{$booking->id}", ['status' => 'cancelled', 'notes' => null])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->deleteJson("/api/bookings/{$booking->id}")->assertNoContent();
        expect(Booking::count())->toBe(0);
    });
});

describe('list', function () {
    it('paginates and filters by status', function () {
        foreach (range(1, 12) as $i) {
            makeBooking([
                'service_bay' => 1,
                'starts_at' => now()->addDays($i)->setTime(9, 0),
                'ends_at' => now()->addDays($i)->setTime(10, 0),
                'status' => $i % 3 === 0 ? 'pending' : 'confirmed',
            ]);
        }

        $this->getJson('/api/bookings?per_page=5&page=2')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.total', 12);

        $this->getJson('/api/bookings?status=pending')
            ->assertOk()
            ->assertJsonCount(4, 'data')
            ->assertJsonMissing(['status' => 'confirmed']);
    });

    it('rejects an unknown status filter', function () {
        $this->getJson('/api/bookings?status=banana')->assertUnprocessable()->assertJsonValidationErrors('status');
    });
});

describe('validation', function () {
    it('reports every invalid field', function () {
        $this->postJson('/api/bookings', [
            'customer_email' => 'not-an-email',
            'rego' => '<script>',
            'service_bay' => 99,
            'starts_at' => '2027-03-01T11:00:00+10:00',
            'ends_at' => '2027-03-01T09:00:00+10:00',
            'status' => 'banana',
        ])->assertUnprocessable()->assertJsonValidationErrors([
            'customer_name', 'customer_email', 'rego', 'service_bay', 'ends_at', 'status',
        ]);
    });

    it('does not let a PATCH move the end before the stored start', function () {
        $booking = makeBooking();

        $this->patchJson("/api/bookings/{$booking->id}", ['ends_at' => '2027-03-01T08:00:00+10:00'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('ends_at');
    });
});

describe('the overlap rule', function () {
    it('rejects an overlapping booking in the same bay and names the field', function () {
        makeBooking();

        $this->postJson('/api/bookings', bookingPayload([
            'starts_at' => '2027-03-01T10:00:00+10:00',
            'ends_at' => '2027-03-01T12:00:00+10:00',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('starts_at');

        expect(Booking::count())->toBe(1);
    });

    it('rejects a booking that fully contains, or sits inside, an existing one', function () {
        makeBooking();

        $this->postJson('/api/bookings', bookingPayload([
            'starts_at' => '2027-03-01T08:00:00+10:00', 'ends_at' => '2027-03-01T13:00:00+10:00',
        ]))->assertUnprocessable();

        $this->postJson('/api/bookings', bookingPayload([
            'starts_at' => '2027-03-01T09:30:00+10:00', 'ends_at' => '2027-03-01T10:00:00+10:00',
        ]))->assertUnprocessable();
    });

    it('allows back-to-back bookings in the same bay', function () {
        makeBooking();

        $this->postJson('/api/bookings', bookingPayload([
            'starts_at' => '2027-03-01T11:00:00+10:00', 'ends_at' => '2027-03-01T12:00:00+10:00',
        ]))->assertCreated();

        $this->postJson('/api/bookings', bookingPayload([
            'starts_at' => '2027-03-01T08:00:00+10:00', 'ends_at' => '2027-03-01T09:00:00+10:00',
        ]))->assertCreated();
    });

    it('compares instants, not clock times, when offsets differ', function () {
        makeBooking(); // 09:00 to 11:00 at +10:00, i.e. 23:00 to 01:00 UTC

        $this->postJson('/api/bookings', bookingPayload([
            'starts_at' => '2027-02-28T23:30:00+00:00',
            'ends_at' => '2027-03-01T00:30:00+00:00',
        ]))->assertUnprocessable()->assertJsonValidationErrors('starts_at');
    });

    it('allows the same time in a different bay', function () {
        makeBooking();

        $this->postJson('/api/bookings', bookingPayload(['service_bay' => 3]))->assertCreated();
    });

    it('ignores cancelled bookings', function () {
        makeBooking(['status' => 'cancelled']);

        $this->postJson('/api/bookings', bookingPayload())->assertCreated();
    });

    it('lets a booking be edited without clashing with itself', function () {
        $booking = makeBooking();

        $this->patchJson("/api/bookings/{$booking->id}", ['notes' => 'Now with a water test'])->assertOk();
    });

    it('re-checks the slot when an edit moves a booking onto another', function () {
        makeBooking();
        $other = makeBooking([
            'starts_at' => '2027-03-01T13:00:00+10:00', 'ends_at' => '2027-03-01T14:00:00+10:00',
        ]);

        $this->patchJson("/api/bookings/{$other->id}", ['starts_at' => '2027-03-01T10:00:00+10:00'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('starts_at');

        expect($other->fresh()->starts_at->toIso8601String())->toBe('2027-03-01T03:00:00+00:00'); // unchanged: 13:00+10:00 is 03:00 UTC
    });

    it('re-checks the slot when a cancelled booking is reactivated', function () {
        $cancelled = makeBooking(['status' => 'cancelled']);
        makeBooking(); // someone else took the slot meanwhile

        $this->patchJson("/api/bookings/{$cancelled->id}", ['status' => 'confirmed'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('starts_at');
    });
});
