<?php

use Illuminate\Support\Facades\Process;
use Illuminate\Process\Pool;

/*
 * Real concurrency needs real processes, so this test starts eight PHP
 * processes at once against one SQLite file, all trying to book the same slot
 * in the same bay. Exactly one may win.
 */
it('lets exactly one of eight simultaneous requests take the same slot', function () {
    $db = tempnam(sys_get_temp_dir(), 'bookings-race-').'.sqlite';
    touch($db);

    $env = [
        'DB_CONNECTION' => 'sqlite',
        'DB_DATABASE' => $db,
        'CACHE_STORE' => 'database',
        'APP_ENV' => 'testing',
    ];

    Process::path(base_path())->env($env)->run([PHP_BINARY, 'artisan', 'migrate', '--force'])->throw();

    $results = Process::pool(function (Pool $pool) use ($env) {
        foreach (range(1, 8) as $i) {
            $pool->path(base_path())->env($env)->command([PHP_BINARY, 'tests/Support/book-slot.php']);
        }
    })->start()->wait();

    $outputs = collect($results)->map(fn ($r) => trim($r->output()))->countBy();

    @unlink($db);
    @unlink($db.'-wal');
    @unlink($db.'-shm');

    expect($outputs->get('BOOKED'))->toBe(1)
        ->and($outputs->get('CLASH'))->toBe(7)
        ->and($outputs->keys()->filter(fn ($k) => str_starts_with($k, 'ERROR')))->toBeEmpty();
});
