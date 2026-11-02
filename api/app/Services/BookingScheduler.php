<?php

namespace App\Services;

use App\Models\Booking;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The one place a booking is written. It enforces "no overlapping bookings in
 * the same service bay" under concurrency:
 *
 *  1. A per-bay cache lock serialises writers to the same bay on any database.
 *  2. The check and the write run in one transaction. The SQLite connection
 *     uses BEGIN IMMEDIATE (config/database.php), so a second writer waits for
 *     the first to commit instead of both reading "free" and both inserting.
 *
 * Boundaries are half-open: a booking that ends at 10:00 does not clash with
 * one that starts at 10:00.
 */
class BookingScheduler
{
    public function save(Booking $booking, array $attributes): Booking
    {
        $booking->fill($attributes);

        // A cancelled row holds no slot, so there is nothing to guard.
        if (! $booking->status->holdsSlot()) {
            $booking->save();

            return $booking;
        }

        return Cache::lock("bookings:bay:{$booking->service_bay}", 10)
            ->block(5, fn () => DB::transaction(function () use ($booking) {
                $this->assertSlotFree($booking);
                $booking->save();

                return $booking;
            }));
    }

    private function assertSlotFree(Booking $booking): void
    {
        $clash = Booking::query()
            ->overlapping($booking->service_bay, $booking->starts_at, $booking->ends_at)
            ->when($booking->exists, fn ($q) => $q->whereKeyNot($booking->getKey()))
            ->orderBy('starts_at')
            ->first();

        if ($clash) {
            throw ValidationException::withMessages([
                'starts_at' => sprintf(
                    'Service bay %d is already booked from %s to %s. Choose another time or bay.',
                    $booking->service_bay,
                    $this->label($clash->starts_at),
                    $this->label($clash->ends_at),
                ),
            ]);
        }
    }

    private function label(CarbonInterface $at): string
    {
        return $at->format('j M Y H:i');
    }
}
