<?php

namespace App\Http\Requests;

use App\Enums\BookingStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email:rfc', 'max:255'],
            'rego' => ['required', 'string', 'max:12', 'regex:/^[A-Za-z0-9 -]+$/'],
            'service_bay' => ['required', 'integer', 'between:1,'.config('workshop.bays')],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'status' => ['sometimes', Rule::enum(BookingStatus::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'rego.regex' => 'The registration may only contain letters, numbers, spaces and dashes.',
            'service_bay.between' => 'Choose a service bay from 1 to '.config('workshop.bays').'.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('rego'))) {
            $this->merge(['rego' => strtoupper(trim($this->input('rego')))]);
        }
    }
}
