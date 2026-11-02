<?php

namespace App\Http\Controllers;

use App\Enums\BookingStatus;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Requests\UpdateBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Services\BookingScheduler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class BookingController extends Controller
{
    public function __construct(private BookingScheduler $scheduler) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'status' => ['sometimes', Rule::enum(BookingStatus::class)],
            'per_page' => ['sometimes', 'integer', 'between:1,100'],
        ]);

        return BookingResource::collection(
            Booking::query()
                ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
                ->orderBy('starts_at')
                ->orderBy('id')
                ->paginate($filters['per_page'] ?? 10)
                ->withQueryString()
        );
    }

    public function store(StoreBookingRequest $request): JsonResponse
    {
        $booking = $this->scheduler->save(
            new Booking,
            $request->validated() + ['status' => BookingStatus::Pending->value],
        );

        return (new BookingResource($booking))->response()->setStatusCode(201);
    }

    public function show(Booking $booking): BookingResource
    {
        return new BookingResource($booking);
    }

    public function update(UpdateBookingRequest $request, Booking $booking): BookingResource
    {
        return new BookingResource($this->scheduler->save($booking, $request->validated()));
    }

    public function destroy(Booking $booking): JsonResponse
    {
        $booking->delete();

        return response()->json(null, 204);
    }
}
