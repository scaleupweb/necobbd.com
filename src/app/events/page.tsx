import Link from "next/link";
import { Calendar, MapPin, Users, Ticket, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { JoinButton } from "@/components/ui/JoinButton";
import { formatDate, formatTime } from "@/lib/utils";
import { FitImage } from "@/components/ui/FitImage";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = (await db.getEvents()).filter((e: any) => e.status !== "CANCELLED");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="pb-6 border-b border-slate-200">
        <div className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">
          <Calendar className="w-4 h-4 text-black" />
          <span>Esports Arenas & Meetups</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
          Official LAN <span className="text-slate-500">Stages & Events</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-xl">
          Grand Finals arena stages, divisional community meetups, and open 1v1 gauntlets across Bangladesh.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {events.length === 0 && (
          <div className="md:col-span-2 rounded-3xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">No events announced yet. Check back soon.</div>
        )}
        {events.map((ev: any) => (
          <div
            key={ev.id}
            id={ev.slug}
            className="scroll-mt-24 rounded-3xl bg-white border border-slate-200 overflow-hidden hover:border-black p-6 flex flex-col justify-between space-y-5 transition-all group shadow-sm hover:shadow-md"
          >
            <div className="space-y-4">
              <div className="relative h-56 rounded-2xl overflow-hidden bg-slate-100">
                <FitImage src={ev.banner} alt={ev.name} imgClassName="group-hover:scale-[1.03] transition-transform duration-500" />
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/90 text-white text-xs font-bold shadow-sm">
                  {ev.eventType || "Event"} · {ev.capacity} seats
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-950 group-hover:text-black transition-colors">
                  {ev.name}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {ev.description}
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>{ev.venue || "TBA"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>{formatDate(ev.eventDate)} at {formatTime(ev.eventDate)}</span>
                </div>
                <div className="text-emerald-700 font-bold text-xs pt-1">
                  ✓ {ev.registeredCount} / {ev.capacity} Attendees Registered
                </div>
              </div>
            </div>

            <JoinButton
              endpoint={`/api/events/${ev.slug}/register`}
              memberIds={ev.registeredUserIds}
              isOpen={ev.isRegistrationOpen}
              joinLabel="Register"
              leaveLabel="Cancel my registration"
              closedLabel={new Date(ev.eventDate) < new Date() ? "Event finished" : ev.registeredCount >= ev.capacity ? "Fully booked" : "Registration closed"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
