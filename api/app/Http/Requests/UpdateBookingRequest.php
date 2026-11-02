<?php

namespace App\Http\Requests;

/**
 * Same rules as creating, but every field is optional (PATCH sends only what
 * changed). The scheduler re-checks the overlap rule against the merged row.
 */
class UpdateBookingRequest extends StoreBookingRequest
{
    public function rules(): array
    {
        $rules = collect(parent::rules())
            ->map(fn (array $rule) => in_array('required', $rule, true)
                ? ['sometimes', ...array_values(array_diff($rule, ['required']))]
                : $rule)
            ->all();

        // When only ends_at changes, compare it with the start already stored.
        if (! $this->has('starts_at') && $this->route('booking')) {
            $rules['ends_at'] = ['sometimes', 'date', 'after:'.$this->route('booking')->starts_at->toIso8601String()];
        }

        return $rules;
    }
}
