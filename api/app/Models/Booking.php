<?php

namespace App\Models;

use App\Enums\BookingStatus;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'customer_name', 'customer_email', 'rego', 'service_bay',
        'starts_at', 'ends_at', 'status', 'notes',
    ];

    /*
     * Instants are stored in UTC. Eloquent's datetime cast would keep the offset
     * of an incoming "2027-03-01T09:00:00+10:00" and store the local 09:00,
     * which then compares wrongly with a time sent in another offset, so the
     * overlap rule would miss clashes. These accessors normalise on the way in.
     */
    protected function startsAt(): Attribute
    {
        return $this->utcInstant();
    }

    protected function endsAt(): Attribute
    {
        return $this->utcInstant();
    }

    private function utcInstant(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value === null ? null : Carbon::parse($value, 'UTC'),
            set: fn ($value) => Carbon::parse($value)->utc()->format('Y-m-d H:i:s'),
        );
    }

    protected function casts(): array
    {
        return [
            'service_bay' => 'integer',
            'status' => BookingStatus::class,
        ];
    }

    /** Bookings that occupy a slot in the given bay and intersect [start, end). */
    public function scopeOverlapping(Builder $query, int $bay, $start, $end): Builder
    {
        return $query
            ->where('service_bay', $bay)
            ->where('status', '!=', BookingStatus::Cancelled->value)
            ->where('starts_at', '<', $end)
            ->where('ends_at', '>', $start);
    }
}
