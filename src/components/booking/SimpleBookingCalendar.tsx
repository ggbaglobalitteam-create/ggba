'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  Phone,
  User,
} from 'lucide-react';

import { Button } from '@/components/portal/Button';
import { AppointmentSlotConfig } from '@/types/visa';

type Appointment = {
  id: string;
  date: string;
  time: string;
  title: string;
  isBooked: boolean;
  slotId?: string;
  bookedBy?: {
    name: string;
    email: string;
    phone: string;
    passportNumber?: string;
    nationality?: string;
  };
};

type AppointmentRecord = {
  id: string;
  slotId: string;
  slotDate: string;
  slotTime: string;
  slotTitle?: string | null;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string | null;
  passportNumber?: string | null;
  nationality?: string | null;
  createdAt: string;
};

type ApplicationDetail = {
  formData?: Record<string, unknown>;
  applicant?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
};

type SimpleBookingCalendarProps = {
  applicationId?: string;
  slots?: AppointmentSlotConfig[];
  instructions?: string;
  onBookingComplete?: () => void;
  continueLabel?: string;
};

function buildDefaultSlots(): AppointmentSlotConfig[] {
  const offsets = [2, 3, 6, 9];
  return offsets.map((offset, idx) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return {
      id: `default-slot-${idx + 1}`,
      date: date.toISOString().slice(0, 10),
      time: idx % 2 === 0 ? '09:00' : '14:00',
      title: idx % 2 === 0 ? 'Morning Slot' : 'Afternoon Slot',
    };
  });
}

function toAppointments(inputSlots?: AppointmentSlotConfig[]): Appointment[] {
  const source = inputSlots === undefined ? buildDefaultSlots() : inputSlots;
  return source
    .filter((slot) => Boolean(slot.id && slot.date && slot.time))
    .map((slot) => ({
      id: slot.id,
      date: slot.date,
      time: slot.time,
      title: slot.title || 'Appointment Slot',
      isBooked: false,
      slotId: slot.id,
    }));
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function firstString(data: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export default function SimpleBookingCalendar({
  applicationId,
  slots,
  instructions,
  onBookingComplete,
  continueLabel = 'Continue to Status',
}: SimpleBookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastBooking, setLastBooking] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bookedRecords, setBookedRecords] = useState<AppointmentRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string>("");

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    passportNumber: '',
    nationality: '',
  });

  useEffect(() => {
    const takenSlotIds = new Set(bookedRecords.map((item) => item.slotId));
    const next = toAppointments(slots).map((item) =>
      takenSlotIds.has(item.slotId || item.id)
        ? {
            ...item,
            isBooked: true,
          }
        : item
    );
    setAppointments(next);

    const sortedDates = Array.from(new Set(next.map((item) => item.date))).sort((a, b) =>
      a.localeCompare(b)
    );
    setSelectedDate(sortedDates[0] || null);

    if (sortedDates[0]) {
      const first = new Date(`${sortedDates[0]}T00:00:00`);
      if (!Number.isNaN(first.getTime())) {
        setCurrentDate(new Date(first.getFullYear(), first.getMonth(), 1));
      }
    }
  }, [slots, bookedRecords]);

  useEffect(() => {
    async function loadBookingContext() {
      if (!applicationId) return;

      const [appRes, recordsRes] = await Promise.all([
        fetch(`/api/applications/${encodeURIComponent(applicationId)}`),
        fetch(`/api/applications/${encodeURIComponent(applicationId)}/appointments`),
      ]);
      const appData = (await appRes.json().catch(() => null)) as ApplicationDetail | null;
      const recordsData = (await recordsRes.json().catch(() => ({}))) as { items?: AppointmentRecord[] };

      const formDataRaw = asRecord(appData?.formData);
      const fullName = `${firstString(formDataRaw, ['firstName'])} ${firstString(formDataRaw, ['lastName'])}`.trim();
      const nextForm = {
        name: fullName || `${appData?.applicant?.firstName || ''} ${appData?.applicant?.lastName || ''}`.trim(),
        email: firstString(formDataRaw, ['email']) || appData?.applicant?.email || '',
        phone: firstString(formDataRaw, ['phone']) || appData?.applicant?.phone || '',
        passportNumber: firstString(formDataRaw, ['passportNumber', 'passportNo', 'passport_number']),
        nationality: firstString(formDataRaw, ['nationality', 'citizenship']),
      };
      setFormData(nextForm);
      setBookedRecords(Array.isArray(recordsData?.items) ? recordsData.items : []);
    }

    void loadBookingContext();
  }, [applicationId]);

  const appointmentDates = useMemo(
    () => Array.from(new Set(appointments.map((appointment) => appointment.date))),
    [appointments]
  );

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getAppointmentsForDate = (dateStr: string) => {
    return appointments.filter((appointment) => appointment.date === dateStr);
  };

  const hasAvailableSlots = (dateStr: string) => {
    const dayAppointments = getAppointmentsForDate(dateStr);
    return dayAppointments.some((appointment) => !appointment.isBooked);
  };

  const isFullyBooked = (dateStr: string) => {
    const dayAppointments = getAppointmentsForDate(dateStr);
    return dayAppointments.length > 0 && dayAppointments.every((appointment) => appointment.isBooked);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (dateStr: string) => {
    if (!appointmentDates.includes(dateStr)) return;
    setSelectedDate(dateStr);
    setShowBookingForm(false);
  };

  const handleBookAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowBookingForm(true);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment || !applicationId) return;
    setErrorText('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/applications/${encodeURIComponent(applicationId)}/appointments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedAppointment.slotId || selectedAppointment.id,
          slotDate: selectedAppointment.date,
          slotTime: selectedAppointment.time,
          slotTitle: selectedAppointment.title,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorText(typeof payload?.error === 'string' ? payload.error : 'Failed to book appointment');
        return;
      }

      const created = payload as AppointmentRecord;
      setBookedRecords((prev) => [created, ...prev]);

      const updatedAppointments = appointments.map((appointment) =>
        appointment.id === selectedAppointment.id
          ? {
              ...appointment,
              isBooked: true,
              bookedBy: {
                name: created.applicantName,
                email: created.applicantEmail,
                phone: created.applicantPhone || '',
                passportNumber: created.passportNumber || '',
                nationality: created.nationality || '',
              },
            }
          : appointment
      );
      setAppointments(updatedAppointments);

      const booked = {
        ...selectedAppointment,
        isBooked: true,
        bookedBy: {
          name: created.applicantName,
          email: created.applicantEmail,
          phone: created.applicantPhone || '',
          passportNumber: created.passportNumber || '',
          nationality: created.nationality || '',
        },
      };
      setLastBooking(booked);
      setShowBookingForm(false);
      setShowConfirmation(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookAnother = () => {
    setShowConfirmation(false);
    setSelectedAppointment(null);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = Number.parseInt(hours, 10);
    if (Number.isNaN(hour)) return time;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  const days = [];
  for (let i = 0; i < firstDay; i += 1) {
    days.push(<div key={`empty-${i}`} className="aspect-square bg-gray-50" />);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateStr = formatDate(year, month, day);
    const dayAppointments = getAppointmentsForDate(dateStr);
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDate;
    const fullyBooked = isFullyBooked(dateStr);
    const available = hasAvailableSlots(dateStr);

    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(dateStr)}
        disabled={dayAppointments.length === 0}
        className={`
          aspect-square rounded-lg font-medium transition-all p-2
          ${isToday ? 'bg-blue-100 border-2 border-blue-400' : ''}
          ${fullyBooked ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''}
          ${available && !isToday ? 'bg-white hover:bg-green-50 hover:border-2 hover:border-green-500 cursor-pointer' : ''}
          ${dayAppointments.length === 0 ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}
          ${isSelected ? 'ring-2 ring-blue-500' : ''}
        `}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <span className={isToday ? 'text-blue-600 font-bold' : ''}>{day}</span>
          {available && <span className="text-xs text-green-600 mt-1">●</span>}
          {fullyBooked && <span className="text-xs text-red-600 mt-1">●</span>}
        </div>
      </button>
    );
  }

  if (showConfirmation && lastBooking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed</h2>
              <p className="text-gray-600">Your appointment has been successfully scheduled.</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Date and Time</p>
                    <p className="font-semibold text-gray-900">
                      {formatDisplayDate(lastBooking.date)} at {formatTime(lastBooking.time)}
                    </p>
                  </div>
                </div>

                {lastBooking.bookedBy && (
                  <>
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-semibold text-gray-900">{lastBooking.bookedBy.name}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold text-gray-900">{lastBooking.bookedBy.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-semibold text-gray-900">{lastBooking.bookedBy.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Passport Number</p>
                        <p className="font-semibold text-gray-900">{lastBooking.bookedBy.passportNumber || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Nationality</p>
                        <p className="font-semibold text-gray-900">{lastBooking.bookedBy.nationality || 'N/A'}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              A confirmation email has been sent. For support, contact <span className="font-semibold">support@ggbaglobal.com</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleBookAnother} variant="outline" className="w-full">
                Book Another
              </Button>
              {onBookingComplete && (
                <Button onClick={onBookingComplete} className="w-full">
                  {continueLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="min-h-[50vh] bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Appointment Slots Not Available</h1>
          <p className="text-gray-600">
            This visa type currently has no appointment slots configured. Ask admin to add slots in Form Configs.
          </p>
          {instructions && <p className="text-sm text-gray-500">{instructions}</p>}
          {onBookingComplete && (
            <Button onClick={onBookingComplete}>{continueLabel}</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Book Your Appointment</h1>
          <p className="text-gray-600">Select an available date to view and book appointment slots.</p>
          {instructions && <p className="text-sm text-gray-500 mt-2">{instructions}</p>}
          {!applicationId && (
            <p className="text-sm text-red-600 mt-2">
              Active application not found. Please return to Application Form and reopen your submitted application.
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold text-gray-900">
                  {monthNames[month]} {year}
                </h2>

                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">{days}</div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-lg">●</span>
                    <span className="text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 text-lg">●</span>
                    <span className="text-gray-600">Fully Booked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border-2 border-blue-400 rounded"></div>
                    <span className="text-gray-600">Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            {selectedDate ? (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Available Slots</h3>
                <p className="text-sm text-gray-600 mb-4">{formatDisplayDate(selectedDate)}</p>

                <div className="space-y-3">
                  {getAppointmentsForDate(selectedDate).map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`p-4 rounded-lg border-2 ${
                        appointment.isBooked
                          ? 'bg-gray-50 border-gray-300'
                          : 'bg-green-50 border-green-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span className="font-semibold">{formatTime(appointment.time)}</span>
                        </div>
                        {appointment.isBooked && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                            Booked
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{appointment.title}</p>
                      {!appointment.isBooked ? (
                        <button
                          disabled={!applicationId}
                          onClick={() => handleBookAppointment(appointment)}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                          {applicationId ? 'Book This Slot' : 'Application not found'}
                        </button>
                      ) : (
                        <div className="text-xs text-gray-500">This slot is no longer available.</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Select a date to view available appointment slots.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booked Appointments</h2>
          {bookedRecords.length === 0 ? (
            <p className="text-gray-500">No appointment booked yet for this application.</p>
          ) : (
            <div className="space-y-3">
              {bookedRecords.map((record) => (
                <div key={record.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="font-semibold text-gray-900">
                    {formatDisplayDate(record.slotDate)} at {formatTime(record.slotTime)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Passport: {record.passportNumber || 'N/A'} | Nationality: {record.nationality || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Confirmed for {record.applicantName} ({record.applicantEmail})
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showBookingForm && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold mb-2">Complete Your Booking</h2>
              <p className="text-green-100">
                {formatDisplayDate(selectedAppointment.date)} at {formatTime(selectedAppointment.time)}
              </p>
            </div>

            <form onSubmit={handleSubmitBooking} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  placeholder="Full name from application"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  placeholder="Email from application"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  placeholder="Phone from application"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passport Number</label>
                <input
                  type="text"
                  value={formData.passportNumber}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  placeholder="Passport from submitted form"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                <input
                  type="text"
                  value={formData.nationality}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  placeholder="Nationality from submitted form"
                />
              </div>

              {errorText && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errorText}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingForm(false);
                    setSelectedAppointment(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-lg"
                >
                  {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
