<?php

namespace App\Enums;

enum BookingStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Cancelled = 'cancelled';

    /** Cancelled bookings free their slot; every other status holds it. */
    public function holdsSlot(): bool
    {
        return $this !== self::Cancelled;
    }
}
