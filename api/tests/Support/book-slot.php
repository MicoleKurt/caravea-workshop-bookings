<?php

/**
 * Child process used by BookingConcurrencyTest: boots the app against the
 * database named in the environment and tries to book one fixed slot.
 * Prints BOOKED, CLASH or ERROR:<message>.
 */

use App\Models\Booking;
use App\Services\BookingScheduler;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Validation\ValidationException;

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

try {
    app(BookingScheduler::class)->save(new Booking, [
        'customer_name' => 'Racer '.getmypid(),
        'customer_email' => 'racer@example.com',
        'rego' => 'RACE 1',
        'service_bay' => 1,
        'starts_at' => '2027-06-01 09:00:00',
        'ends_at' => '2027-06-01 11:00:00',
        'status' => 'confirmed',
    ]);
    echo 'BOOKED';
} catch (ValidationException) {
    echo 'CLASH';
} catch (Throwable $e) {
    echo 'ERROR:'.$e->getMessage();
}
