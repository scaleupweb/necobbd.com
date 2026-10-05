import { Hero } from "@/components/home/Hero";
import { CountdownBanner } from "@/components/home/CountdownBanner";
import { LiveMatches } from "@/components/home/LiveMatches";
import { OngoingTournamentsAndActivity } from "@/components/home/OngoingTournamentsAndActivity";
import { WeeklyStarsSection } from "@/components/home/WeeklyStarsSection";
import { TopScorersAndClubs } from "@/components/home/TopScorersAndClubs";
import { TransferMarketSection } from "@/components/home/TransferMarketSection";
import { NewsAndEvents } from "@/components/home/NewsAndEvents";
import { PartnersSection } from "@/components/home/PartnersSection";
import { CommunityCTA } from "@/components/home/CommunityCta";
import { ClubsSpotlight } from "@/components/home/ClubsSpotlight";
import { NewestPlayers } from "@/components/home/NewestPlayers";
import { getSiteSettings } from "@/lib/settings";
import { getHomepageData } from "@/lib/homepage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSiteSettings();
  let data;
  try {
    data = await getHomepageData(settings);
  } catch (err) {
    console.error("Homepage data failed:", err);
    data = null;
  }
  const s = settings.sections;

  return (
    <div className="w-full bg-[#F6F7F9] min-h-screen text-[#111111]">
      <Hero hero={settings.hero} stats={data?.stats || []} />

      {/* The banner disappears on its own once the deadline has passed. */}
      {settings.countdown.enabled && settings.countdown.targetDate && new Date(settings.countdown.targetDate).getTime() > Date.now() && (
        <CountdownBanner countdown={settings.countdown} tournament={data?.countdownTournament || null} />
      )}

      {data && s.partners.show && data.partners.length > 0 && (
        <PartnersSection title={s.partners.title} subtitle={s.partners.subtitle} partners={data.partners} />
      )}


      {!data && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            Live data is temporarily unavailable. Please check the database connection.
          </div>
        </div>
      )}

      {data && s.liveMatches.show && data.matches.length > 0 && <LiveMatches title={s.liveMatches.title} matches={data.matches} />}

      {data && (s.tournaments.show || s.activity.show) && (
        <OngoingTournamentsAndActivity
          tournamentsTitle={s.tournaments.title}
          activityTitle={s.activity.title}
          showTournaments={s.tournaments.show}
          showActivity={s.activity.show}
          featured={data.featuredTournament}
          tournaments={data.tournamentsList}
          activities={data.activities}
        />
      )}

      {data && s.clubRankings.show && data.clubRankings.length === 0 && <ClubsSpotlight title="Clubs" data={data.clubsSpotlight} />}

      {data && <NewestPlayers players={data.newestPlayers} />}

      {data && s.weeklyStars.show && data.weeklyStars.length > 0 && (
        <WeeklyStarsSection title={s.weeklyStars.title} subtitle={s.weeklyStars.subtitle} stars={data.weeklyStars} />
      )}

      {data && (s.topScorers.show || s.clubRankings.show) && (data.topScorers.length > 0 || data.clubRankings.length > 0) && (
        <TopScorersAndClubs
          scorersTitle={s.topScorers.title}
          clubsTitle={s.clubRankings.title}
          showScorers={s.topScorers.show}
          showClubs={s.clubRankings.show}
          topScorers={data.topScorers}
          clubRankings={data.clubRankings}
        />
      )}

      {data && s.transfers.show && <TransferMarketSection content={s.transfers} players={data.transferPlayers} />}

      {data && (s.news.show || s.events.show) && (data.news.length > 0 || data.events.length > 0) && (
        <NewsAndEvents
          newsTitle={s.news.title}
          eventsTitle={s.events.title}
          showNews={s.news.show}
          showEvents={s.events.show}
          news={data.news}
          events={data.events}
        />
      )}

      {settings.cta.show && <CommunityCTA cta={settings.cta} />}
    </div>
  );
}
