// NECOB built-in rulebook (shown on /rules until an admin writes their own in Homepage & Site Content).
// Plain data so the page can render a table of contents, numbered sections and callouts.

export type RuleItem = string | { text: string; sub?: string[] };
export type RuleSection = {
  id: string;
  title: string;
  icon: "settings" | "swords" | "clock" | "users" | "wifi" | "video" | "id" | "card" | "star" | "flag" | "shield" | "trophy";
  intro?: string;
  blocks: { title?: string; items?: RuleItem[]; table?: { head: string[]; rows: string[][] }; note?: string; tone?: "info" | "warn" | "danger" }[];
};

export const QUICK_FACTS = [
  { label: "Match length", value: "8 min" },
  { label: "Condition", value: "Normal" },
  { label: "Smart Assist", value: "OFF" },
  { label: "Proof deadline", value: "10 min" },
  { label: "Complaint window", value: "20 min" },
  { label: "Time zone", value: "GMT+6" },
];

export const RULEBOOK: RuleSection[] = [
  {
    id: "match-settings",
    title: "Match settings",
    icon: "settings",
    blocks: [
      {
        items: [
          "Every official game is played in a Friend Match room: 8-minute match time, Normal condition, default extra time / penalties off unless the fixture says otherwise.",
          "Smart Assist must be OFF in every official game. The setting may be checked in the proof video.",
          "The player marked 🔑 in the lineup is the room host: they create the room and share the room code in the match group. If they can't connect (VPN, network), they ask the opponent to host.",
          {
            text: "If a game starts with the wrong settings, the wrong device or the wrong account:",
            sub: [
              "Spotted during the game: stop, and replay the remaining time from the current score with the right settings.",
              "Spotted after the game with clear proof: the game is replayed. Doing it on purpose leads to a card (section 8).",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "club-match",
    title: "Club matches & points",
    icon: "swords",
    intro: "A NECOB club match is a set of individual 1v1 games between the two squads (for example 10v10).",
    blocks: [
      {
        items: [
          "Each 1v1 game: win = 3 game points, draw = 1 game point each, loss = 0.",
          "The club with more game points wins the club match and gets 3 table points. Equal game points is a draw: 1 table point each.",
          "Group table order: table points → game-point difference → goal difference → goals scored.",
          "A player can play only one game in a club match.",
          "Groups may include BYEs (empty slots). A club drawn against a BYE wins that match automatically (3 table points, no game points or goals).",
        ],
      },
      {
        title: "Knockout",
        items: [
          "Two-leg ties are decided on total game points over both legs, then total goals.",
          "If still level, the tie is decided by a deciding game or the method the match operations announce; the admin records the club that goes through.",
        ],
      },
    ],
  },
  {
    id: "schedule",
    title: "Schedule, response & auto results",
    icon: "clock",
    intro: "Every match has a lineup: who plays whom, in which time slot, and who hosts (🔑). It is on the match page and in the announcement text.",
    blocks: [
      {
        table: {
          head: ["Step", "When", "What must happen"],
          rows: [
            ["Response", "10 minutes before the slot time", "Both players reply in the match group (\"ready\")."],
            ["Room", "Within 5 minutes of the slot time", "The 🔑 host creates the room and posts the code."],
            ["Join", "Within 5 minutes of the code being posted", "The opponent joins and readies up."],
            ["Deadline", "End of the slot window", "The game must have started."],
          ],
        },
      },
      {
        title: "Auto results",
        tone: "warn",
        items: [
          "Neither player responds in time → auto draw.",
          "Only one player responds → the other player gets an auto loss.",
          "Host doesn't create the room in time (and didn't ask the opponent to host) → auto loss for the host.",
          "Opponent doesn't join within 5 minutes of the room code → auto loss for that player.",
          "An auto win counts as 1–0.",
          "To claim an auto result, mention the opponent and their captain in the match group during the response time and keep screenshots.",
          "Players may agree to play earlier than the slot; both captains must confirm in the match group.",
          "Match operations or admins can decide differently when the auto rules don't fit; their decision is final.",
        ],
      },
    ],
  },
  {
    id: "lineup",
    title: "Lineup, substitutes & captains",
    icon: "users",
    blocks: [
      {
        items: [
          "Captains send their players to match operations before the lineup deadline; the admin publishes the lineup.",
          "Only players in the club's approved squad (registered before the fixture) may play.",
          {
            text: "Substitutes",
            sub: [
              "A substitute must be from the same squad and must not have played in that club match.",
              "Ask before the slot's response time with both captains tagged; match operations approve it in the group.",
              "Emergency substitutes (sudden network or device problem) are allowed until the slot time if match operations agree.",
            ],
          },
          "Each club has one captain per match (shown on the match page). The captain may hand over to another squad member at most twice per matchday and must announce it in the group.",
          "The match code is for the two captains only. Never share it outside the two clubs; ask an admin for a new code if it leaks.",
        ],
      },
    ],
  },
  {
    id: "disconnect",
    title: "Disconnects, lag & rematches",
    icon: "wifi",
    blocks: [
      {
        items: [
          "If a game disconnects, both players screenshot their screen right away. A rematch must start within 10 minutes.",
          "The rematch plays only the remaining time. Goals scored before the disconnect stand only with clear proof (screenshot or video).",
          "The player who was leading must show proof of the score; without it their lead is cancelled.",
          "Refusing a rematch after a disconnect gives the opponent the win.",
          "Repeated or deliberate disconnects (to escape a loss) lead to a yellow card; three disconnects in one game go to match operations, who decide the result.",
          "Disconnecting during a clear chance (penalty, 1v1, free kick) is decided by match operations.",
          "Wasting time with endless back passes is not allowed. With video proof, extra time is added in a rematch and a yellow card may follow.",
        ],
      },
      {
        title: "VPN / can't connect",
        tone: "info",
        items: [
          "Both players close background apps, start screen recording and try again; then the other player hosts.",
          "If it still fails, both send the recordings to the match group. Match operations may allow a substitute or reschedule.",
          "Refusing to record or to try the steps → auto loss.",
        ],
      },
    ],
  },
  {
    id: "proof",
    title: "Proof & result submission",
    icon: "video",
    blocks: [
      {
        items: [
          "Winner: a screenshot or screen recording of the final result page. Draw: both players. Disconnect: the leading player.",
          "Proof must show both names, the score and, when asked, the room, Konami ID and Smart Assist setting.",
          "Post proof in the match group within 10 minutes of the game ending. Proof must come from the player who played (forwarded or edited proof is not accepted).",
          "Captains submit the full result in the Captain area of the match page with the match code (scores + proof link). It counts only after an admin approves it.",
          "Complaints about a game (missing proof, wrong player, Smart Assist on) must be raised in the match group within 20 minutes of the game ending. Later complaints are not accepted and the result stands.",
          "If proof is missing and a complaint is made in time, the game is replayed. Fake or edited proof leads to a red card.",
        ],
      },
    ],
  },
  {
    id: "identity",
    title: "Player identity & information",
    icon: "id",
    blocks: [
      {
        items: [
          "One NECOB account per person. Your Konami UID must be your own and is unique on NECOB.",
          "Your name, Facebook profile, UID and device on NECOB must match the account you play with. Update them before fixtures are published; changes after that may not apply to that match.",
          "Playing on someone else's account, or someone playing for you (proxy), is a serious offence (section 8).",
          "Wrong information spotted before the game: fix it or use a substitute. Playing with wrong information after an opponent's complaint → auto loss.",
          "NECOB may ask for identity proof at any time for official tournaments.",
        ],
      },
    ],
  },
  {
    id: "conduct",
    title: "Conduct, cards & bans",
    icon: "card",
    blocks: [
      {
        table: {
          head: ["Card", "Effect"],
          rows: [
            ["Warning", "Recorded; no other effect."],
            ["Yellow", "Stays on record for 30 days. A second yellow in that time (or two in one matchday) becomes a red."],
            ["Red", "7-day match ban. A red before the player's game is played = auto loss for that game."],
          ],
        },
      },
      {
        title: "Bans",
        tone: "danger",
        items: [
          "Abuse, threats or harassment in match groups or on social media: from a 3-day ban up to a permanent ban.",
          "Proxy (someone else playing), multiple accounts or match fixing: 6 months to permanent ban; a club whose management took part can be removed from the tournament.",
          "Fake proof, cheating tools or editing results: red card and a ban decided by the admins.",
          "All decisions are listed on the public Disciplinary page.",
        ],
      },
    ],
  },
  {
    id: "motm",
    title: "Man of the Match",
    icon: "star",
    blocks: [
      {
        items: [
          "Chosen by match operations from the winning side, in this order: decisive win → goal difference → clean sheet → goals scored → opponent's rating.",
          "Players with an auto win or a card in that match can't be MOTM.",
          "In a drawn club match, the player whose result secured the draw comes first. Popularity is never a criterion.",
        ],
      },
    ],
  },
  {
    id: "walkover",
    title: "Withdrawals & no-shows",
    icon: "flag",
    blocks: [
      {
        items: [
          "A club that can't play must tell the admins at least 24 hours before the matchday.",
          "A club that doesn't show (or withdraws later) loses every game of that club match as auto losses.",
          "A club that is absent must inform the opponent captain in the match group before the first slot; otherwise the present club must still report in time to get the auto win.",
          "If a club was never invited to the match group, the match may be rescheduled.",
        ],
      },
    ],
  },
  {
    id: "roles",
    title: "Matchday roles & appeals",
    icon: "shield",
    blocks: [
      {
        items: [
          "Captain: joins the match group, adds the players, keeps the team on time, reports problems and submits the result.",
          "Player: responds on time, talks to the opponent, records proof and follows match operations.",
          "Match operations (judges): run the match group, check proof, decide disputes and give cards.",
          "Appeals against a matchday decision go to the admins within 24 hours. The admins decide within 1–7 days; their decision is final.",
          "Captains and players are expected to know these rules — not knowing them is not an excuse.",
        ],
      },
    ],
  },
  {
    id: "general",
    title: "Squads, transfers & ratings",
    icon: "trophy",
    blocks: [
      {
        items: [
          "Each club has a Main Team Squad of up to {SQUAD} players. Clubs sign players through the Transfer Window; every signing needs admin approval and starts a {CONTRACT}-day contract.",
          "A player can belong to one club at a time and is frozen for {FREEZE} days after joining.",
          "Every player starts on a rating of {BASE}. Ratings change only after approved games, using an Elo formula; goal difference, clean sheets and MOTM add a little extra.",
          "All times are Bangladesh time (GMT+6). Keep your phone charged, with storage and data for recording — device problems are not an excuse.",
        ],
      },
    ],
  },
];
