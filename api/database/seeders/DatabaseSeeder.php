<?php

namespace Database\Seeders;

use App\Models\Booking;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /** A week of realistic bookings so the list, filter and pagination have something to show. */
    public function run(): void
    {
        $customers = [
            ['Sam Carter', 'sam@example.com', 'CVN 214'],
            ['Priya Nair', 'priya@example.com', 'XJ 88 TR'],
            ['Tom Walsh', 'tom@example.com', 'RV 4410'],
            ['Mei Chen', 'mei@example.com', 'CAR 007'],
            ['Jack O\'Neill', 'jack@example.com', 'TRV 321'],
            ['Ana Silva', 'ana@example.com', 'VAN 902'],
        ];
        $services = ['Gas check and brake service', 'Annual safety inspection', 'Bearing repack', 'Water system test', 'Awning repair', 'Electrical fault'];
        $statuses = ['confirmed', 'pending', 'confirmed', 'cancelled', 'confirmed', 'pending'];

        $day = now()->startOfWeek()->addDays(7)->setTime(8, 0);

        foreach (range(0, 17) as $i) {
            [$name, $email, $rego] = $customers[$i % 6];
            $start = $day->copy()->addDays(intdiv($i, 6))->addHours(($i % 3) * 3);

            Booking::create([
                'customer_name' => $name,
                'customer_email' => $email,
                'rego' => $rego,
                'service_bay' => ($i % 6) + 1,
                'starts_at' => $start,
                'ends_at' => $start->copy()->addHours(2),
                'status' => $statuses[$i % 6],
                'notes' => $services[$i % 6],
            ]);
        }
    }
}
