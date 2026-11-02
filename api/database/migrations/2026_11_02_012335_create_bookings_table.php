<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('rego', 12);
            $table->unsignedSmallInteger('service_bay');
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->string('status', 16)->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Serves the overlap lookup: one bay, non-cancelled, a time window.
            $table->index(['service_bay', 'status', 'starts_at', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
