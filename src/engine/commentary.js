// Fabrizio Romano style commentary and manager quotes

const FABRIZIO_GOAL_COMMENTS = [
  "HERE WE GO! {player} finds the net! {team} take the lead! Done deal, confirmed!",
  "BOOM! {player} scores! This is what we've been waiting for. Exclusive: the ball is in the net!",
  "{player} with the goal! Here we go, it's happening! {team} are cooking!",
  "GOAL! {player}! My sources confirm: that's a goal. Medical completed, announcement imminent!",
  "{player} scores for {team}! Communicado Oficial incoming! Here we go confirmed!",
  "The deal is DONE! {player} buries it! {team} celebrating! Paperwork signed!",
];

const FABRIZIO_CARD_COMMENTS = [
  "Breaking: {player} shown the card. Negotiations over. Here we go!",
  "{player} booked! My sources say the referee was NOT happy. Deal collapsed!",
  "EXCLUSIVE: {player} receives a card! This changes everything! Total agreement with the referee!",
  "{player} in the book! The situation is getting complicated. More soon!",
];

const FABRIZIO_RED_CARD_COMMENTS = [
  "BREAKING: {player} sent OFF! Red card confirmed! Here we go... home!",
  "Done deal: {player} is OFF! Contract terminated! Walking down the tunnel!",
  "{player} RED CARD! Exclusive: the shower is waiting. Medical incoming!",
  "BOOM! {player} gets the red! My sources confirm: an early bath! Total agreement!",
];

const FABRIZIO_MISS_COMMENTS = [
  "{player} MISSES! The deal fell through at the last minute!",
  "So close! {player} couldn't complete the signing... I mean, scoring!",
  "{player} hits the post! Here we go... oh wait, no we don't!",
  "EXCLUSIVE: {player} misses! My sources say the goalkeeper made a save!",
];

const FABRIZIO_SAVE_COMMENTS = [
  "GREAT SAVE! The keeper says NO DEAL to {player}! Negotiations rejected!",
  "{player}'s shot saved! The transfer... I mean goal... blocked! Here we go... NOT!",
  "The keeper with a stunning save! {player} deal OFF!",
];

const FABRIZIO_HALFTIME_COMMENTS = [
  "Half time! Let me check my sources about what happens next... More soon!",
  "45 minutes done! Here we go to the break! Medical in progress!",
  "Half time whistle! My sources tell me there's another 45 minutes to go. Exclusive!",
];

const FABRIZIO_FULLTIME_COMMENTS = [
  "FULL TIME! The deal is DONE! {homeTeam} {homeGoals} - {awayGoals} {awayTeam}! Here we go, it's over!",
  "90 minutes! Communicado Oficial: {homeTeam} {homeGoals} - {awayGoals} {awayTeam}! Paperwork complete!",
  "It's OVER! {homeTeam} {homeGoals} - {awayGoals} {awayTeam}! My sources confirm: that's the final score!",
];

// Extra time commentary
const FABRIZIO_EXTRA_TIME_START = [
  "HERE WE GO! Extra time! 30 more minutes! The deal isn't done yet!",
  "EXTRA TIME! My sources confirm: we need 30 more minutes to decide this! Incredible drama!",
  "Can't believe it! Extra time incoming! Both teams still negotiating! Here we go!",
];

const FABRIZIO_EXTRA_TIME_HALFTIME = [
  "Half of extra time complete! 15 more minutes! The tension is UNREAL! More soon!",
  "Extra time break! Still level! My sources say: ANYTHING can happen! Here we go!",
];

const FABRIZIO_EXTRA_TIME_END = [
  "End of extra time! {homeTeam} {homeGoals} - {awayGoals} {awayTeam}! What a battle!",
  "120 MINUTES! Extra time done! {homeTeam} {homeGoals} - {awayGoals} {awayTeam}! Incredible scenes!",
];

// Penalty commentary
const FABRIZIO_PENALTIES_START = [
  "PENALTIES! HERE WE GO! The ultimate drama! Exclusive: nerves are real!",
  "We're going to PENALTIES! My sources say: this is where heroes are made! Here we go!",
  "Penalty shootout time! The deal will be done from 12 yards! INCREDIBLE!",
];

const FABRIZIO_PENALTY_SCORED = [
  "{player} SCORES! Ice cold from the spot! {score}! Here we go!",
  "GOAL! {player} buries it! {score}! Done deal from 12 yards!",
  "{player} sends the keeper the wrong way! {score}! Clinical execution!",
];

const FABRIZIO_PENALTY_MISSED = [
  "{player} MISSES! The keeper saves! {score}! DRAMA!",
  "SAVED! {player}'s penalty kept out! {score}! The deal fell through!",
  "{player} hits the post! MISS! {score}! Unbelievable scenes!",
  "Over the bar! {player} blazes over! {score}! The pressure got to him!",
];

const FABRIZIO_PENALTY_WINNER = [
  "{team} WIN ON PENALTIES {homeScore}-{awayScore}! INCREDIBLE! The ultimate drama! Here we go!",
  "IT'S OVER! {team} triumph in the shootout! {homeScore}-{awayScore}! My sources confirm: CHAMPIONS!",
  "DONE DEAL from penalties! {team} victorious! {homeScore}-{awayScore}! What a story!",
];

const FABRIZIO_DRAMATIC_COMMENTS = [
  "LAST MINUTE DRAMA! {player} with a LATE goal! Here we go BOOM!",
  "STOPPAGE TIME! {player} SCORES! This is why we love football! HERE WE GOOO!",
  "UNBELIEVABLE! {player} in the dying minutes! Exclusive: CHAOS!",
];

// Manager post-match quotes - Generic fallback
const MANAGER_WIN_QUOTES = [
  "The boys showed incredible character today. Also, I'm incredible. Mostly me, actually.",
  "We executed the game plan perfectly. The game plan was to score more than them. Revolutionary.",
  "I told them at halftime to just be better. And they listened. I'm basically a genius.",
  "People doubted us. I never did. Okay, maybe at halftime. But I'm back to being confident!",
  "This is what happens when you pay the players. I mean, when they work hard.",
  "We deserved this win. Also every other win. And a few draws that went against us.",
];

const MANAGER_LOSS_QUOTES = [
  "The referee had a different interpretation of the rules. His interpretation was wrong.",
  "We played well but the scoreboard lied. Technology these days, you can't trust it.",
  "If football was about possession and chances, we'd have won. Sadly, it's about goals.",
  "The grass was too green. Very distracting for my players.",
  "We'll analyze what went wrong. Spoiler: it was everyone except me.",
  "Next week is a new week. This week never happened. What game?",
];

const MANAGER_DRAW_QUOTES = [
  "A point away from home is... actually we were at home. One point then.",
  "We dominated but football is cruel. Also, we didn't dominate.",
  "I'm proud of the performance. Less proud of the result. Very mathematical.",
  "The draw was fair. Neither team deserved to win. Including us, sadly.",
  "Glass half full: we didn't lose. Glass half empty: we didn't win. I need a drink.",
];

// Real managers with their distinctive talking styles
const REAL_MANAGERS = {
  // José Mourinho - Real Madrid
  'real-madrid': {
    name: 'José Mourinho',
    title: 'The Special One',
    win: [
      "I have nothing to say. My team won. This is what special managers do with special players.",
      "If I speak, I am in trouble. But today? Today I speak because we won. I am the Special One.",
      "They said Madrid couldn't win like this. They don't know me. I have won everywhere I've been.",
      "My players executed my vision perfectly. When you have Mourinho, you have success.",
      "The media wanted us to fail. But I am José Mourinho. I always win in the end.",
      "This is Mourinho football. You don't like it? Check the scoreboard. We won.",
    ],
    loss: [
      "I have nussing to say. If I speak I am in big trouble. Big, big trouble.",
      "The referee? I cannot speak about the referee. I would need more than one press conference.",
      "We played against 12 men today. Eleven players and one referee. That is the truth.",
      "I prefer not to comment. If I speak, I will be suspended. Again.",
      "This is a disgrace. Football heritage? They destroyed it today.",
      "I am not angry. I am just... I have nussing to say. Nussing.",
    ],
    draw: [
      "One point away from home is... *pauses dramatically* ...still a point.",
      "The result doesn't reflect my genius. But these things happen in football.",
      "I wanted to win. Mourinho always wants to win. But today, we draw. Tomorrow, we win.",
      "A draw is not defeat. I don't do defeat. I do... waiting to win.",
    ],
  },

  // Pep Guardiola - Barcelona
  'barcelona': {
    name: 'Pep Guardiola',
    title: 'Head Coach',
    win: [
      "It was incredible, guys. The way we moved the ball, finding the spaces... this is how we want to play.",
      "Football is about making the pitch big when you have the ball and small when you don't. Today we did it perfectly.",
      "I'm so proud of my guys. The commitment, the intensity... they gave everything. More than everything.",
      "We controlled the game through possession. That's the Barcelona way. That's MY way.",
      "The players understood the game plan. Position, position, position. Movement. Space. This is beautiful football.",
      "Today was special. My players... *gets emotional* ...they make me proud to be their coach.",
    ],
    loss: [
      "Congratulations to our opponents. They were better today. We have to accept it and work harder.",
      "I have to analyze what happened. We didn't control the spaces like I wanted. That's my fault.",
      "Football is cruel sometimes. We had possession, we had chances... but that's not enough. We need to be better.",
      "I will take responsibility. When we lose, it's my fault. The players gave everything, I didn't prepare them well enough.",
      "This is painful, guys. Very painful. But we will come back. This team has character.",
      "We need more, guys. More intensity, more movement, more belief. Tomorrow we train again.",
    ],
    draw: [
      "It's okay, it's okay. Not what we wanted but we stay positive. We continue working.",
      "The process is more important than one result. We played our football. The goals will come.",
      "I saw many good things today. Yes, we draw, but the way we played... I am satisfied with the process.",
      "Football doesn't always reward the team that plays better. But we keep believing in our style.",
    ],
  },

  // Hansi Flick - Bayern Munich
  'bayern': {
    name: 'Hansi Flick',
    title: 'Head Coach',
    win: [
      "The team showed great discipline today. We executed our pressing plan very well and created good chances.",
      "I'm pleased with the performance. The players showed the mentality we need to be successful.",
      "We prepared well and the team responded. That's what Bayern is about - professionalism and excellence.",
      "A deserved win. High pressing, quick transitions - this is how Bayern plays.",
      "The work on the training ground paid off today. The players were focused and clinical.",
      "Good result. We controlled the game well and were efficient in front of goal. We continue.",
    ],
    loss: [
      "We didn't play to our standards today. We need to analyze this and do better next time.",
      "Football is about small details. Today the details went against us. We accept it and move on.",
      "Not satisfied with the result. We gave away possession too easily and were punished. That's not Bayern level.",
      "A disappointing day but we stay calm. One game doesn't define our season. We work harder tomorrow.",
      "Credit to our opponents. We will learn from this and come back stronger. That's the Bayern mentality.",
      "We need to be more clinical. The chances were there but we didn't take them. That's football.",
    ],
    draw: [
      "A fair result. We had chances, they had chances. We take the point and focus on the next game.",
      "Not fully satisfied but not disappointed either. The team fought well. We build from here.",
      "Sometimes in football you don't get what you deserve. We created enough to win but it wasn't meant to be.",
      "The performance was acceptable but Bayern always wants to win. We'll keep pushing.",
    ],
  },

  // Mikel Arteta - Manchester City
  'man-city': {
    name: 'Mikel Arteta',
    title: 'Head Coach',
    win: [
      "The boys were incredible today. The energy, the commitment - this is what we're building here.",
      "We executed the game plan perfectly. I'm so proud of the players.",
      "This is what happens when you believe in the process. We keep going.",
      "Beautiful performance. The way we controlled the game was exactly what we trained for.",
    ],
    loss: [
      "We need to be better. Simple as that. We go again.",
      "Football is about margins. Today we were on the wrong side. We learn and improve.",
      "Not good enough. We have to look at ourselves and work harder.",
      "Disappointed but we stay together. This group has character.",
    ],
    draw: [
      "A point is a point. We wanted more but we keep pushing.",
      "Mixed feelings. Good moments but not enough to win. We continue working.",
    ],
  },

  // Arne Slot - Liverpool
  'liverpool': {
    name: 'Arne Slot',
    title: 'Head Coach',
    win: [
      "Very pleased with the performance. The intensity was excellent throughout.",
      "We played our football and got the result we deserved. Good day.",
      "The team showed great maturity today. We controlled the important moments.",
      "Happy with the win. The players implemented our ideas very well.",
    ],
    loss: [
      "We have to accept when we're not good enough. Today was one of those days.",
      "Credit to our opponents. We didn't reach our level today.",
      "Disappointed but we analyze, we learn, we improve. That's the process.",
      "Not our best day. We need to be more clinical when chances come.",
    ],
    draw: [
      "A fair result based on the game. We created chances but couldn't convert.",
      "We take the point and move on. There are positives to build on.",
    ],
  },

  // Luis Enrique - PSG
  'psg': {
    name: 'Luis Enrique',
    title: 'Head Coach',
    win: [
      "Exceptional performance. The players understood everything we worked on.",
      "This is PSG football. Dominant, creative, effective. Very happy.",
      "We controlled the game from start to finish. That's what I want to see.",
      "The team played with personality. This is the level we expect.",
    ],
    loss: [
      "In football you don't always get what you deserve. We were the better team.",
      "I'm not happy but I'm calm. We played well, the result doesn't reflect that.",
      "We need to be more efficient. The performance was there, the goals weren't.",
      "Football is sometimes unfair. We keep working, we keep believing.",
    ],
    draw: [
      "We dominated but couldn't score enough. That's football sometimes.",
      "Not satisfied with one point but the performance gives me confidence.",
    ],
  },

  // Thiago Motta - Juventus
  'juventus': {
    name: 'Thiago Motta',
    title: 'Head Coach',
    win: [
      "The team showed character and quality. This is what Juventus is about.",
      "Very satisfied. We played with intelligence and determination.",
      "A complete performance. Defense solid, attack effective. Well done to the players.",
      "We imposed our game. This is the mentality we need every match.",
    ],
    loss: [
      "We have to accept defeat and learn from it. No excuses.",
      "Not our day. We lacked sharpness in the final third.",
      "Football is cruel sometimes. We gave everything but it wasn't enough.",
      "We need to improve. This is not the level Juventus should accept.",
    ],
    draw: [
      "A point away from home is acceptable but we wanted more.",
      "We showed resilience. Not perfect but the team fought hard.",
    ],
  },

  // Simone Inzaghi - Inter Milan
  'inter': {
    name: 'Simone Inzaghi',
    title: 'Head Coach',
    win: [
      "Great performance from the boys. We executed our plan perfectly.",
      "Inter showed its quality today. Very proud of the team.",
      "We were clinical and solid. This is the Inter I want to see.",
      "Excellent result. The players gave everything on the pitch.",
    ],
    loss: [
      "We have to do better. This performance is not acceptable.",
      "Disappointed. We made too many errors and got punished.",
      "Not good enough today. We need to react immediately.",
      "We have to look at ourselves. Credit to our opponents but we weren't at our level.",
    ],
    draw: [
      "We deserved more but football doesn't always reward you. We move on.",
      "A point is not what we wanted. We need to be more clinical.",
    ],
  },

  // Diego Simeone - Atletico Madrid
  'atletico': {
    name: 'Diego Simeone',
    title: 'El Cholo',
    win: [
      "Partido a partido. That's how we do it. One game at a time.",
      "The team showed the Atleti spirit. Fight, sacrifice, victory.",
      "This is what we are. Warriors. Every game is a battle and today we won.",
      "My players gave their souls on that pitch. I'm proud of them.",
    ],
    loss: [
      "We gave everything. Sometimes that's not enough. We keep fighting.",
      "Football is about small details. Today they went against us.",
      "Defeat hurts but it won't break us. Atleti never gives up.",
      "We need to be better. Simple. No excuses, just work.",
    ],
    draw: [
      "We fought until the end. That's Atleti. We never stop.",
      "A point is a point. We wanted more but we showed character.",
    ],
  },

  // Nuri Sahin - Borussia Dortmund
  'dortmund': {
    name: 'Nuri Sahin',
    title: 'Head Coach',
    win: [
      "The Yellow Wall deserved this victory. The players gave everything.",
      "Beautiful football and a great result. This is what Dortmund is about.",
      "We played with intensity and quality. Very happy for the fans.",
      "The team showed great spirit today. We keep building.",
    ],
    loss: [
      "Not good enough. We have to be honest with ourselves and improve.",
      "Disappointed but we stay together. This club is about unity.",
      "We made too many mistakes. We need to work harder in training.",
      "The fans deserve better. We have to respond next game.",
    ],
    draw: [
      "We wanted to win but we take the point. The effort was there.",
      "Not satisfied but we showed fighting spirit. We continue working.",
    ],
  },
};

// Get random item from array
function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate Fabrizio comment for an event
export function getFabrizioComment(event, homeTeam, awayTeam) {
  const team = event.team === 'home' ? homeTeam.name : awayTeam.name;
  let comment = '';

  switch (event.type) {
    case 'goal':
      comment = event.dramatic
        ? random(FABRIZIO_DRAMATIC_COMMENTS)
        : random(FABRIZIO_GOAL_COMMENTS);
      break;
    case 'yellow_card':
      comment = random(FABRIZIO_CARD_COMMENTS);
      break;
    case 'red_card':
    case 'second_yellow':
      comment = random(FABRIZIO_RED_CARD_COMMENTS);
      break;
    case 'miss':
      comment = random(FABRIZIO_MISS_COMMENTS);
      break;
    case 'save':
      comment = random(FABRIZIO_SAVE_COMMENTS);
      break;
    default:
      return null;
  }

  return comment
    .replace('{player}', event.player)
    .replace('{team}', team);
}

export function getHalftimeComment() {
  return random(FABRIZIO_HALFTIME_COMMENTS);
}

export function getFulltimeComment(homeTeam, awayTeam, homeGoals, awayGoals) {
  return random(FABRIZIO_FULLTIME_COMMENTS)
    .replace('{homeTeam}', homeTeam.name)
    .replace('{awayTeam}', awayTeam.name)
    .replace('{homeGoals}', homeGoals)
    .replace('{awayGoals}', awayGoals);
}

export function getManagerQuote(isHome, homeGoals, awayGoals, teamName, teamId = null) {
  // Determine result type
  let resultType;
  if (isHome) {
    if (homeGoals > awayGoals) resultType = 'win';
    else if (homeGoals < awayGoals) resultType = 'loss';
    else resultType = 'draw';
  } else {
    if (awayGoals > homeGoals) resultType = 'win';
    else if (awayGoals < homeGoals) resultType = 'loss';
    else resultType = 'draw';
  }

  // Check if we have a real manager for this team
  const realManager = teamId && REAL_MANAGERS[teamId];

  if (realManager) {
    return {
      team: teamName,
      managerName: realManager.name,
      managerTitle: realManager.title,
      quote: random(realManager[resultType]),
    };
  }

  // Fallback to generic quotes
  let quotes;
  if (resultType === 'win') quotes = MANAGER_WIN_QUOTES;
  else if (resultType === 'loss') quotes = MANAGER_LOSS_QUOTES;
  else quotes = MANAGER_DRAW_QUOTES;

  return {
    team: teamName,
    managerName: 'Manager',
    managerTitle: 'Head Coach',
    quote: random(quotes),
  };
}

// Fabrizio post-match sarcastic press comments
const FABRIZIO_POST_MATCH_COMMENTS = {
  highScoring: [
    "My sources tell me both defenses took the day off. Exclusive: they went to the beach together. Here we go!",
    "BREAKING: FIFA investigating whether this was a football match or a basketball game. More soon!",
    "Both goalkeepers have requested transfers. Can confirm: their agents are already on the phone. Done deal!",
    "My sources say VAR was too confused to intervene. They've filed a complaint. Here we go!",
  ],
  lowScoring: [
    "Exclusive: The ball spent more time in the air than in either box. My sources confirm: it's scared of goals.",
    "BREAKING: Both teams forgot what the goal looks like. Reminder sent via WhatsApp. Here we go!",
    "My sources tell me this match cured insomnia better than any medication. Clinical trials pending!",
    "The 0-0 specialists have done it again! Netflix documentary incoming. Here we go, confirmed!",
  ],
  blowout: [
    "This wasn't a match, this was a crime scene. My sources say the losing manager is updating his LinkedIn.",
    "EXCLUSIVE: The losing team has been offered a participation trophy. Negotiations ongoing!",
    "My sources confirm: the scoreboard operator got a workout today. Overtime pay approved!",
    "BREAKING: One team remembered to bring their players, the other brought traffic cones. Here we go!",
  ],
  close: [
    "My sources say this result will cause approximately 47 arguments on Twitter. Popcorn ready!",
    "EXCLUSIVE: Both managers will claim they deserved to win. Plot twist: neither did. Here we go!",
    "One goal decided it! My sources say the losing team is already preparing excuses. Done deal!",
    "A tight game! My sources confirm: the VAR room needed therapy after this one. More soon!",
  ],
  draw: [
    "Both teams played for a draw and STILL somehow looked surprised. My sources are confused too!",
    "EXCLUSIVE: The draw was so boring, my sources fell asleep mid-update. Here we go... zzz!",
    "A point each! My sources say both managers will pretend this was exactly the plan. Confirmed!",
    "My sources report that entertainment was NOT on the menu today. Refunds denied!",
  ],
  dramatic: [
    "DRAMA! This match had more plot twists than a Netflix series. Season 2 confirmed!",
    "My sources say the scriptwriters outdid themselves today. Hollywood calling! Here we go!",
    "EXCLUSIVE: Heart medication sales up 300% after this match. Pharmaceutical stocks rising!",
    "What a game! My sources confirm: even I couldn't predict this. And I know EVERYTHING!",
  ],
};

// Get random Fabrizio post-match comment
export function getFabrizioPostMatchComment(homeGoals, awayGoals, hadDrama = false) {
  const totalGoals = homeGoals + awayGoals;
  const goalDiff = Math.abs(homeGoals - awayGoals);

  let category;
  if (hadDrama) {
    category = 'dramatic';
  } else if (homeGoals === awayGoals) {
    category = totalGoals === 0 ? 'lowScoring' : 'draw';
  } else if (goalDiff >= 3) {
    category = 'blowout';
  } else if (totalGoals >= 5) {
    category = 'highScoring';
  } else if (goalDiff === 1) {
    category = 'close';
  } else {
    category = 'close';
  }

  return random(FABRIZIO_POST_MATCH_COMMENTS[category]);
}

// Fabrizio auction comments - SITUATIONAL based on auction context
const FABRIZIO_AUCTION_TEMPLATES = {
  // When one team is spending way more than others
  bigSpender: [
    "EXCLUSIVE: {bigSpender} have gone CRAZY! {bigSpenderSpent} spent already! My sources say their accountant just resigned. Here we go!",
    "{bigSpender} are buying EVERYONE! {bigSpenderSpent} gone! My sources confirm: money printer goes BRRR!",
    "Breaking: {bigSpender} treating this auction like a shopping spree! {bigSpenderSpent} spent! The other teams are just watching!",
    "My sources CANNOT believe what {bigSpender} are doing! {bigSpenderSpent} spent! Is this Football Manager on easy mode?!",
    "ALERT: {bigSpender} have lost their minds! {bigSpenderSpent} and COUNTING! Their bank called - it went to voicemail!",
    "{bigSpender} spending {bigSpenderSpent} like it's Monopoly money! My sources confirm: the other owners are FURIOUS!",
    "HERE WE GO! {bigSpender} with {bigSpenderSpent}! My sources say Financial Fair Play just fainted. Medical team called!",
    "EXCLUSIVE: {bigSpender} burning through cash! {bigSpenderSpent}! My sources say their credit card is smoking!",
    "Breaking: {bigSpender} can't stop won't stop! {bigSpenderSpent} spent! Someone check if they know there's a budget!",
    "{bigSpender} with {bigSpenderSpent}! My sources confirm: they're not buying a team, they're buying a small country!",
    "UPDATE: {bigSpender} treating {bigSpenderSpent} like pocket change! My sources say other clubs are filing complaints!",
    "BOOM! {bigSpender} flexing with {bigSpenderSpent}! My sources confirm: subtlety is NOT in their vocabulary!",
  ],
  // When auction is very competitive
  competitive: [
    "The competition is INTENSE! {count} players, {totalSpent} spent! My sources say managers are losing sleep. Drama confirmed!",
    "EXCLUSIVE: Every player is a BATTLE! {count} sold for {totalSpent}! My sources confirm: egos are CLASHING!",
    "Here we go! {count} players and NOBODY is backing down! {totalSpent} spent! This is what we live for!",
    "WAR! That's the only word for this auction! {count} players, {totalSpent} spent! My sources need blood pressure medication!",
    "SCENES! Every bid is a statement! {count} sold, {totalSpent} gone! My sources say the tension could be cut with a knife!",
    "Breaking: It's a DOGFIGHT out here! {count} players, {totalSpent}! No team is giving an inch! Here we go!",
    "EXCLUSIVE: Pride is on the line! {count} players sold for {totalSpent}! My sources confirm: this is PERSONAL now!",
    "My sources have never seen competition like this! {count} players, {totalSpent}! Everyone wants to WIN!",
    "UPDATE: The auction room is a WARZONE! {count} sold, {totalSpent} spent! Medics on standby for the losing bidders!",
    "INCREDIBLE! {count} players and every single one was CONTESTED! {totalSpent} spent! This is elite-level chaos!",
    "Here we go! {count} players and the managers are STARING EACH OTHER DOWN! {totalSpent} gone! Love this game!",
    "Breaking: Bidding wars EVERYWHERE! {count} players, {totalSpent}! My sources say friendships are ending tonight!",
  ],
  // When there are bargains (players going for base price)
  bargains: [
    "STEAL ALERT! {bargainCount} players went for BASE PRICE! My sources say some managers were sleeping! Here we go!",
    "Breaking: {bargainCount} BARGAINS in the last batch! Someone's getting fired for missing those! {totalSpent} total!",
    "Exclusive: While everyone fought over stars, {bargainCount} gems went cheap! My sources call it 'smart' or 'lucky'. Same thing!",
    "ROBBERY in broad daylight! {bargainCount} players at minimum price! My sources say some scouts are getting pay cuts!",
    "HOW?! {bargainCount} quality players went for NOTHING! My sources confirm: someone wasn't paying attention!",
    "GIFTS! {bargainCount} players basically given away! My sources say the lucky teams are doing victory dances!",
    "Breaking: {bargainCount} STEALS! While big clubs fought over 1 player, smart clubs grabbed {bargainCount}! Here we go!",
    "Exclusive: {bargainCount} bargain bin specials! My sources say the players are confused why nobody wanted them!",
    "UNBELIEVABLE! {bargainCount} players at base price! My sources confirm: this is either genius or everyone else is asleep!",
    "Alert: {bargainCount} players ROBBED from the auction! Legal theft! My sources say no refunds will be given!",
    "{bargainCount} value picks while others overpaid! My sources say this is the difference between smart and... not smart!",
    "HERE WE GO with {bargainCount} bargains! My sources confirm: some manager just won the auction without anyone noticing!",
  ],
  // When there are expensive signings
  expensive: [
    "MONEY TALKS! {expensivePlayer} went for {expensivePrice}! My sources say that's more than some countries' GDP!",
    "Breaking: {expensivePlayer} breaks the bank at {expensivePrice}! The accountants are crying! Here we go!",
    "EXCLUSIVE: {expensivePrice} for {expensivePlayer}! My sources confirm: that's a LOT of zeros!",
    "STATEMENT SIGNING! {expensivePlayer} for {expensivePrice}! My sources say the check had to be triple-verified!",
    "WOW! {expensivePlayer} commands {expensivePrice}! My sources confirm: worth every penny or biggest flop ever. No middle ground!",
    "Breaking: {expensivePrice} on the table for {expensivePlayer}! My sources say the player's agent just bought a yacht!",
    "BLOCKBUSTER! {expensivePlayer} goes for {expensivePrice}! My sources say that's generational wealth for the selling club!",
    "SCENES! {expensivePrice} for {expensivePlayer}! My sources confirm: they didn't blink, they didn't negotiate, they just PAID!",
    "Exclusive: {expensivePlayer} valued at {expensivePrice}! My sources say inflation is real but THIS is something else!",
    "HERE WE GO BIG! {expensivePrice} for {expensivePlayer}! My sources say the wire transfer crashed the banking system!",
    "PREMIUM PAID! {expensivePlayer} at {expensivePrice}! My sources confirm: pressure is now IMMENSE. No hiding from that price!",
    "Record territory! {expensivePlayer} for {expensivePrice}! My sources say history was made. Good or bad? TBD!",
  ],
  // When a team has bought many players
  squadBuilder: [
    "{squadBuilder} now have {squadSize} players! They're building an ARMY! My sources say the bus is getting crowded!",
    "EXCLUSIVE: {squadBuilder} collecting players like Pokemon! {squadSize} in the squad! Gotta catch 'em all!",
    "{squadBuilder} with {squadSize} players! My sources say they might need a bigger training ground!",
    "Breaking: {squadBuilder} assembling the Avengers! {squadSize} players and counting! My sources say the locker room is PACKED!",
    "{squadBuilder} up to {squadSize}! My sources confirm: they're not building a team, they're building a DYNASTY!",
    "DEPTH! {squadBuilder} with {squadSize} players! My sources say the B team could win most leagues!",
    "Exclusive: {squadBuilder} hoarding talent! {squadSize} in the squad! Other clubs: 'Leave some for us!' Here we go!",
    "{squadBuilder} now {squadSize} deep! My sources say squad rotation will need a spreadsheet and 3 analysts!",
    "UPDATE: {squadBuilder} treating players like collectibles! {squadSize} now! My sources say they need name tags at training!",
    "HERE WE GO! {squadBuilder} at {squadSize} players! My sources confirm: that's not a squad, that's a small village!",
    "{squadBuilder} with {squadSize}! My sources say the manager is going to need a bigger whiteboard. Much bigger!",
    "Breaking: {squadBuilder} building depth like never before! {squadSize} players! Competition for places will be BRUTAL!",
  ],
  // Generic fallback
  generic: [
    "{count} players gone! {totalSpent} spent! My sources say this is EXACTLY what football needed. More chaos!",
    "Auction update: {count} sold, {totalSpent} spent. My sources confirm: everyone thinks they're winning. Spoiler: they're not!",
    "HERE WE GO! {count} players done! Some will be heroes, some will be... squad players. That's football!",
    "Breaking: {count} players, {totalSpent} spent! My sources say drama levels are OFF THE CHARTS! More soon!",
    "EXCLUSIVE: {count} players in new homes! {totalSpent} changed hands! My sources confirm: football is CHAOS and we love it!",
    "{count} done, {totalSpent} gone! My sources say at least 3 managers are having regrets. The other 5 will have them later!",
    "UPDATE: {count} players sold for {totalSpent}! My sources confirm: every team thinks they won. Classic auction delusion!",
    "Here we go! {count} players, {totalSpent}! My sources say the real winners are the agents. Always the agents!",
    "{count} transfers complete! {totalSpent} spent! My sources confirm: someone got a bargain, someone got robbed. Tale as old as time!",
    "MILESTONE: {count} players auctioned! {totalSpent} total! My sources say we're just getting started. Buckle up!",
    "Breaking: {count} down, more to go! {totalSpent} spent so far! My sources say the calculators are overheating!",
    "Auction vibes: {count} players, {totalSpent}! My sources confirm: some genius moves, some head-scratchers. Balance!",
  ],
};

// Manager tweets during auction - SITUATIONAL based on team performance
const MANAGER_AUCTION_TWEETS = {
  mourinho: {
    winning: [
      "We are building something SPECIAL. Other teams spend. We INVEST. That's the Mourinho difference.",
      "Look at our squad. Look at our signings. Now look at theirs. I rest my case. The Special One delivers.",
      "They said Madrid couldn't compete. They were wrong. They are always wrong about me.",
      "When you have Mourinho, you have success. The squad proves it. The trophies will follow.",
      "I don't want to talk about other teams. I want to talk about MY team. And my team? Incredible.",
      "The critics are silent now. They always go silent when Mourinho is winning. I'm used to it.",
      "Some managers buy players. I build EMPIRES. Look at what we're creating. Special.",
      "Real Madrid deserves the best. With me, they GET the best. Simple as that.",
      "I've won everywhere. Porto, Chelsea, Inter, Madrid. The pattern? Mourinho wins. Always.",
      "The squad is taking shape. MY shape. The shape of champions. Here we go.",
      "Other managers are worried. I can see it in their eyes. They should be worried.",
      "This is what happens when you trust The Special One. Excellence. Pure excellence.",
    ],
    losing: [
      "I have nussing to say about our rivals' spending. If I speak, I am in big trouble.",
      "The market is UNFAIR. Some teams have unlimited money. We have to be smart. I am smart.",
      "We don't need to spend like crazy. Quality over quantity. I won Champions League with Porto, remember?",
      "If I speak about the spending, I will be suspended. So I prefer not to speak. Nussing.",
      "The system is against us. But I've faced bigger challenges. Porto 2004. Nobody believed. I won.",
      "I'm not jealous. Jealousy is for small managers. I'm just... observing. Carefully.",
      "When you have enemies in football, it means you're doing something right. I have many enemies.",
      "The referees... sorry, the auction... it's complicated. Very complicated. I say no more.",
      "Football heritage is being destroyed. Not by me. By others. You know who.",
      "We wait. We prepare. And when they least expect it? Mourinho strikes. Always.",
      "I've been the underdog before. I LOVE being the underdog. Ask Barcelona 2010.",
      "The budget doesn't matter. Tactics matter. Mentality matters. I have both.",
    ],
    neutral: [
      "I watch this auction and I laugh. These prices? Mourinho would NEVER overpay like this.",
      "Everyone is panic buying. The Special One stays calm. That's why I have trophies.",
      "My transfer strategy? I don't reveal secrets. But I can tell you - I know what I'm doing. Always.",
      "Some signings make sense. Some don't. I won't say which. But I know. I always know.",
      "The auction is entertainment. The season is what matters. Ask me again in May.",
      "I observe, I analyze, I prepare. While others celebrate signings, I plan victories.",
      "Football is chess. Some managers play checkers. Mourinho plays chess. 4D chess.",
      "The window is noise. Training ground is where titles are won. My training ground.",
      "I've seen many auctions. Good ones, bad ones. This one? Time will tell. But I have my opinion.",
      "Players come, players go. Mourinho stays. And Mourinho delivers. That's the constant.",
      "Some teams buy names. We buy WARRIORS. There's a difference. A big difference.",
      "I don't follow trends. Trends follow me. That's been true my whole career.",
    ],
  },
  guardiola: {
    winning: [
      "The squad is coming together beautifully, guys. Players who understand the IDEA. This is what we wanted.",
      "I'm happy with our signings. They can play in the half-spaces, they understand position. Beautiful.",
      "Football is about the PROCESS, and our process is going well. Very well. I'm excited, guys.",
      "The players we got? They understand movement, space, timing. That's what Barcelona is about.",
      "I'm so proud of what we're building. Not just a team - a PHILOSOPHY. That's special, guys.",
      "Every player knows their role. In possession, out of possession. That's the Barcelona way.",
      "The recruitment has been incredible. Players who can think, adapt, execute. Beautiful football coming.",
      "We wanted specific profiles. We got them. Now the work begins. The fun part.",
      "Look at the quality, guys. The technical ability. This is what we dreamed of.",
      "The squad balance is perfect. Defence, midfield, attack. All connected. All understanding.",
      "I can't wait to work with these players. To show them the positions, the movements. It's going to be special.",
      "Barcelona DNA is alive. The signings prove it. We believe in beautiful football. Always.",
    ],
    losing: [
      "It's okay, it's okay. We don't need to spend crazy money. We need the RIGHT players for our system.",
      "Some signings today... *shakes head* ...they don't fit any system. We are more selective. More intelligent.",
      "The money is not important. The IDEA is important. We will find players who understand. We always do.",
      "Football is not about spending the most. It's about playing the best. We will play the best.",
      "I'm not worried, guys. Really. The players who understand football will come to us. They always do.",
      "La Masia exists for a reason. We don't need to buy everyone. We DEVELOP. That's our strength.",
      "The market is crazy, guys. Crazy prices for players who can't find the half-space. We stay patient.",
      "Quality over quantity, always. We might have fewer signings but better signings. Trust the process.",
      "Some clubs collect players. We collect UNDERSTANDING. Different approach, different results.",
      "I believe in my players. The ones we have. The ones we'll develop. That's Barcelona.",
      "Pressure? No pressure. We have an idea, we have a system. The results will come.",
      "Other teams can spend. We will outthink them. That's been my career, guys.",
    ],
    neutral: [
      "Interesting signings today. Can they find the half-spaces? Can they control tempo? That's the question.",
      "I don't judge. Every manager has their philosophy. Ours is about position, control, beauty.",
      "The auction is just the beginning. Training, tactics, the system - that's where matches are won.",
      "Some good players available, guys. Some who could understand the idea. We'll see.",
      "Football is evolving. The players must evolve too. Those who understand, succeed.",
      "I'm curious about some signings. Will they adapt? Will they understand? Time will tell.",
      "The transfer window is one thing. The training ground is everything. That's where magic happens.",
      "Every player has potential. The question is: can they unlock it? Can they see the spaces?",
      "I watch, I learn, I adapt. Every auction teaches something. Every player is a lesson.",
      "Football is beautiful when done right. Today, we saw some beauty. And some... other things.",
      "The market doesn't define us. Our football defines us. That will never change.",
      "Patience, guys. Patience. Good things come to those who understand the game.",
    ],
  },
  flick: {
    winning: [
      "Bayern is building a disciplined squad. Good characters, good players. The system will work.",
      "I'm satisfied with our progress. Professional, focused, no panic. That's the Bayern way.",
      "We identified targets, we executed. Clean, efficient, professional. This is German football.",
      "The squad is taking shape. Pressing ability, tactical intelligence. Everything we wanted.",
      "Good recruitment. Players who work hard, who understand their role. Bayern standards met.",
      "I'm pleased with the business. No drama, no overpaying. Just smart, focused decisions.",
      "The team is coming together. Discipline, quality, mentality. Championship material.",
      "We analyzed the market, we identified the right players, we got them. Simple but effective.",
      "Bayern doesn't make mistakes in the market. This window proves it. Quality additions.",
      "The squad depth is excellent now. Competition for places drives improvement. Good situation.",
      "Professional work from everyone involved. This is how elite clubs operate.",
      "The foundation is strong. Now we build on it. Step by step, game by game.",
    ],
    losing: [
      "We don't chase trends. Bayern builds for the long term. Patience is a virtue.",
      "Other teams spend more. That's fine. We spend smarter. The results will speak.",
      "Not concerned. We have quality, we have system. Football is won on the pitch, not in auctions.",
      "The market is overheated. Bayern doesn't participate in overpaying. Principle matters.",
      "We trust our process. Short-term spending doesn't guarantee long-term success.",
      "Discipline means sometimes saying no. We've said no to some overpriced options. Correct decision.",
      "Bayern's strength is consistency, not flashy signings. We remain consistent.",
      "The other clubs can celebrate now. We'll celebrate at the end of the season.",
      "We don't need the most expensive players. We need the right players. Different thing.",
      "Football is a marathon, not a sprint. Some teams sprint in the window and walk in the season.",
      "Our academy produces quality. Our system develops players. We don't panic buy.",
      "The spending will be judged in May. Not now. We're confident in our approach.",
    ],
    neutral: [
      "The auction proceeds as expected. We remain calm, we remain focused. That's our strength.",
      "Some interesting transfers. We analyze everything. Quick reactions lead to mistakes.",
      "Football is about pressing, discipline, mentality. We look for these qualities. Always.",
      "The market is active. We observe, we evaluate, we decide. No rushed decisions.",
      "Some good signings today. Some questionable ones. Normal market activity.",
      "We have our targets. We work towards them. Calmly, professionally, efficiently.",
      "The window is open. Opportunities exist. We'll act when the conditions are right.",
      "Bayern's approach doesn't change based on what others do. We have our principles.",
      "Interesting developments. We monitor everything. That's thorough preparation.",
      "Some players would fit our system. Some wouldn't. We only pursue the right profiles.",
      "The auction continues. We stay patient. Good things come to those who wait.",
      "Football business requires cool heads. Hot heads make expensive mistakes.",
    ],
  },
};

// Club President tweets during auction - SITUATIONAL
const PRESIDENT_AUCTION_TWEETS = {
  florentino: {
    winning: [
      "Real Madrid is building another GALÁCTICO squad. The best players WANT to come to us. That's the difference.",
      "Look at our signings. Stars. Superstars. This is what the greatest club in history does.",
      "The Super League would have made this easier, but even without it, Madrid dominates. Always.",
      "When you are Real Madrid, players call YOU. That's the power of 15 Champions Leagues.",
      "Our recruitment is simple: we want the best, we GET the best. That's always been the Madrid way.",
      "I see other presidents struggling. At Madrid, we don't struggle. We WIN.",
      "The Bernabéu renovation will be complete. The squad will be complete. Everything goes to plan.",
      "Real Madrid wrote football history. This auction? Just another chapter in our GLORIOUS story.",
      "Ballon d'Or winners want to play for US. That's not arrogance. That's FACT.",
      "Other clubs dream of what we have achieved. We dream of achieving MORE. That's the difference.",
      "Every signing strengthens our legacy. 15 Champions Leagues and counting!",
      "The white shirt is the most prestigious in football. Players know this. The world knows this.",
    ],
    losing: [
      "Real Madrid doesn't need to spend the most. We spend on QUALITY. On GALÁCTICOS. Not just anyone.",
      "Other clubs panic buy. Madrid waits for the right moment. The right player. That's our philosophy.",
      "Money isn't everything. History, prestige, the white shirt - that's what brings players to Madrid.",
      "We don't chase every player. Players should chase US. If they don't understand that, we don't want them.",
      "The best players... they wait for Madrid's call. If not now, next year. They always come eventually.",
      "Real Madrid built empires while others were learning to walk. Patience is our STRENGTH.",
      "I've seen clubs spend fortunes and win nothing. Madrid spends smart and wins EVERYTHING.",
      "The market is temporary. Real Madrid is ETERNAL. We make decisions for the long term.",
      "Other presidents get nervous. Florentino Pérez does not get nervous. Never.",
      "We have 15 Champions Leagues. Other clubs have... dreams. Let them dream while we plan.",
      "Short-term spending is for short-term thinking. Madrid thinks in DECADES, not seasons.",
      "Some players will regret not coming to Madrid. They always do. History repeats itself.",
    ],
    neutral: [
      "At Real Madrid, we don't just buy players. We create LEGENDS. Every signing is calculated.",
      "The market is interesting. But Madrid always gets what Madrid wants. Eventually.",
      "I've built the greatest club in history. One auction won't change our trajectory.",
      "Football needs Real Madrid to be strong. We are doing our part. As always.",
      "The auction continues. Madrid observes. When we move, everyone will know.",
      "Other clubs announce. Real Madrid executes. There's a difference.",
      "Our scouts are the best. Our facilities are the best. Our history is the best. Results follow.",
      "I don't comment on speculation. When Madrid acts, it's decisive. And successful.",
      "The market will calm down. And Madrid will still be standing. As we always are.",
      "Galácticos are not bought. They are CREATED. At the Santiago Bernabéu.",
      "Some signings are obvious. Others are genius. Madrid makes both kinds.",
      "The world watches Real Madrid. We give them something worth watching.",
    ],
  },
  laporta: {
    winning: [
      "VISCA BARÇA! Look at us now! The levers are WORKING! We told you to trust the process!",
      "Barça is BACK! Més que un club, més que un auction! We are building something beautiful!",
      "To all the doubters: look at our squad now! *does a little dance* Força Barça!",
      "The haters said Barcelona was finished. Look at us NOW! Who's laughing? JOAN LAPORTA!",
      "We activated the levers and now we're activating CHAMPIONSHIPS! Visca el Barça!",
      "This is what leadership looks like! Not panic, not fear - VISION! Barcelona's vision!",
      "From crisis to champions! That's the Laporta magic! *winks at camera*",
      "When I said trust me, I MEANT IT! The squad proves Laporta delivers!",
      "Barcelona DNA is ALIVE! Cruyff is smiling! Mes que un club is THRIVING!",
      "They wrote obituaries for Barcelona. We're writing HISTORY instead!",
      "Every signing is a statement: Barcelona fears NO ONE! Força Barça sempre!",
      "The doubters can apologize now. Or stay silent. Either works for me! *laughs*",
    ],
    losing: [
      "The levers... we need more levers! But don't worry! *sweating* Everything is under control!",
      "Barcelona doesn't need to spend crazy money. We have La Masia! We have... *checks notes* ...potential!",
      "Messi... *wipes tear* ...sorry. The auction. Yes. We're being STRATEGIC. Very strategic.",
      "Look, the financial situation is... it's FINE! *nervous laughter* Totally fine! Trust me!",
      "Other clubs spend irresponsibly. Barcelona is RESPONSIBLE. That's... that's good! Right?",
      "La Masia has produced legends before. It will again! *sweating intensifies* Any day now!",
      "The levers are... recharging. Yes, recharging! New levers coming soon! Very soon!",
      "Rome wasn't built in a day. Neither was the Dream Team. *pulls at collar* Patience!",
      "Barcelona's strength is our PHILOSOPHY, not our wallet! *checks empty wallet* Definitely philosophy!",
      "We're being selective! Very selective! *nervously checks other teams' signings* Very, very selective!",
      "The fans trust me. Right? RIGHT? *looks around nervously* Visca Barça...?",
      "This is a long-term project! Long-term! *crosses fingers* Next year will be OUR year!",
    ],
    neutral: [
      "We have levers! Financial levers, sporting levers! *nervous laughter* So many levers!",
      "The economic situation is completely under control. COMPLETELY. Why is everyone looking at me like that?",
      "Barcelona is about values, philosophy, beautiful football. And also winning. We will do both!",
      "I've navigated Barcelona through storms before. This auction? Just a breeze!",
      "Every decision is calculated. Every lever is strategic. Every *checks notes* ...everything is fine!",
      "Barcelona's future is bright! *squints at spreadsheet* Very bright! Blindingly bright!",
      "The Barça way is about more than money. It's about... *dramatic pause* ...SOUL!",
      "We're in a good position. A GREAT position! *tugs collar* The best position!",
      "Trust the process! Trust the levers! Trust LAPORTA! *sweats confidently*",
      "Other clubs have money. Barcelona has IDENTITY. And also some money! Some!",
      "The board has full confidence in the strategy. FULL confidence! *eye twitches*",
      "Mes que un club means we transcend mere financial concerns! *checks bank account* Totally transcend!",
    ],
  },
  uli: {
    winning: [
      "This is the Bayern way! Disciplined, professional, successful. Other clubs should take notes.",
      "Mia san mia! We build squads, not collections. Every player fits the system. That's why we win.",
      "Bayern leads again. No debt, no drama, just RESULTS. That's German efficiency for you!",
      "While others panic, Bayern executes the plan. THE PLAN ALWAYS WORKS.",
      "We've won everything there is to win. This auction? Just the beginning of another trophy season.",
      "German engineering applies to football too. Look at our squad. PRECISION.",
      "Bayern doesn't need to shout. Our trophies speak loud enough.",
      "Other clubs talk about projects. Bayern talks about CHAMPIONSHIPS. Big difference.",
      "Discipline, focus, excellence. Three words. Bayern's three words. That's all you need.",
      "The Bundesliga fears us. Europe fears us. They SHOULD fear us.",
      "When I look at this squad, I see only one thing: TITLES. Many, many titles.",
      "FC Hollywood? No. FC CHAMPIONSHIPS. That's what we are now.",
    ],
    losing: [
      "*grumbles in Bavarian* These prices are INSANE! In my day, we won everything spending HALF of this!",
      "Other clubs overspend. That's fine. Let them. Bayern stays patient. We always catch up. ALWAYS.",
      "Debt is for amateurs. Bayern builds sustainably. You'll see who's laughing in 5 years!",
      "The market has gone MAD! These prices... *shakes head angrily* ...football is losing its mind!",
      "We don't throw money around like drunken sailors. Bayern has STANDARDS.",
      "Let them spend. Let them drown in debt. Bayern will be standing when they fall.",
      "I've seen cycles come and go. Big spenders rise and CRASH. Bayern stays. Always.",
      "*slams table* This is not how football should work! In my day, discipline meant something!",
      "The financial fair play? A JOKE! But Bayern doesn't need rules to be disciplined!",
      "Other clubs will regret this spending. Mark my words. MARK. MY. WORDS.",
      "Bayern's strength is patience. We wait. We strike. We WIN. That's the German way.",
      "Modern football... *sighs in Bavarian* ...I remember when talent mattered more than money!",
    ],
    neutral: [
      "I've seen many auctions. This one? Same chaos as always. Bayern stays calm. Stays focused.",
      "At Bayern, we don't panic buy. We have DISCIPLINE. Something modern football has forgotten.",
      "Other clubs have debt. Bayern has PROFIT. The difference between professionals and... others.",
      "The market does what it does. Bayern does what BAYERN does. Independently.",
      "We observe, we analyze, we act. German methodology. It works. It ALWAYS works.",
      "Chaos is for other clubs. Bayern is ORDER. Pure, efficient, winning ORDER.",
      "Some see the auction as excitement. I see it as business. Cold, calculated business.",
      "Bayern's approach never changes. Why change what wins championships?",
      "Let others get emotional. Bayern uses LOGIC. Logic wins trophies.",
      "I watch this market and I laugh. So many mistakes. Bayern makes no mistakes.",
      "The Allianz Arena will be filled with fans celebrating. That's all that matters.",
      "Football comes and goes. Bayern stays. 120 years and counting. TRADITION.",
    ],
  },
};

// Get club president auction tweet - SITUATIONAL
export function getPresidentAuctionTweet(presidentId, teamStatus = 'neutral') {
  const tweetsByStatus = PRESIDENT_AUCTION_TWEETS[presidentId];
  if (!tweetsByStatus) return null;

  const presidentNames = {
    florentino: { name: 'Florentino Pérez', handle: '@realflorentino', team: 'Real Madrid', title: 'President', teamId: 'real-madrid' },
    laporta: { name: 'Joan Laporta', handle: '@JoanLaportaFCB', team: 'Barcelona', title: 'President', teamId: 'barcelona' },
    uli: { name: 'Uli Hoeneß', handle: '@FCBayern', team: 'Bayern Munich', title: 'Honorary President', teamId: 'bayern' },
  };

  const tweets = tweetsByStatus[teamStatus] || tweetsByStatus.neutral;

  return {
    ...presidentNames[presidentId],
    tweet: random(tweets),
  };
}

// Get all president tweets for auction milestone - WITH CONTEXT
export function getAllPresidentAuctionTweets(context = {}) {
  const { teams = [] } = context;

  // Calculate team rankings
  const teamStats = teams.map(t => ({
    id: t.id,
    spent: (t.retainedPlayers?.reduce((s, p) => s + (p.retentionPrice || 0), 0) || 0) +
           (t.auctionedPlayers?.reduce((s, p) => s + (p.purchasePrice || 0), 0) || 0),
    squadSize: (t.retainedPlayers?.length || 0) + (t.auctionedPlayers?.length || 0),
  }));

  // Sort by squad size, then by spending
  teamStats.sort((a, b) => {
    if (b.squadSize !== a.squadSize) return b.squadSize - a.squadSize;
    return b.spent - a.spent;
  });

  const getStatus = (teamId) => {
    const rank = teamStats.findIndex(t => t.id === teamId);
    if (rank === 0) return 'winning';
    if (rank >= teamStats.length - 2) return 'losing';
    return 'neutral';
  };

  return [
    getPresidentAuctionTweet('florentino', getStatus('real-madrid')),
    getPresidentAuctionTweet('laporta', getStatus('barcelona')),
    getPresidentAuctionTweet('uli', getStatus('bayern')),
  ];
}

// Get Fabrizio auction comment - SITUATIONAL
export function getFabrizioAuctionComment(context) {
  const {
    playerCount,
    totalSpent,
    teams = [],
    recentSales = [],
  } = context;

  const formatMoney = (amount) => {
    if (amount >= 1000000000) return `€${(amount / 1000000000).toFixed(1)}B`;
    return `€${(amount / 1000000).toFixed(0)}M`;
  };

  // Analyze the situation
  const teamSpending = teams.map(t => ({
    name: t.shortName || t.name,
    spent: (t.retainedPlayers?.reduce((s, p) => s + (p.retentionPrice || 0), 0) || 0) +
           (t.auctionedPlayers?.reduce((s, p) => s + (p.purchasePrice || 0), 0) || 0),
    squadSize: (t.retainedPlayers?.length || 0) + (t.auctionedPlayers?.length || 0),
  })).sort((a, b) => b.spent - a.spent);

  const biggestSpender = teamSpending[0];
  const avgSpending = totalSpent / Math.max(teams.length, 1);

  // Count bargains (players sold at or near base price)
  const bargainCount = recentSales.filter(p => p.soldFor <= (p.basePrice || 5000000) * 1.2).length;

  // Find most expensive recent sale
  const expensiveSale = recentSales.length > 0
    ? recentSales.reduce((max, p) => (p.soldFor > (max?.soldFor || 0)) ? p : max, null)
    : null;

  // Find team with most players
  const biggestSquad = teamSpending.reduce((max, t) => t.squadSize > (max?.squadSize || 0) ? t : max, null);

  // Determine which template to use based on situation
  let templateKey = 'generic';
  let replacements = {
    count: playerCount,
    totalSpent: formatMoney(totalSpent),
  };

  // Check for big spender (>50% more than average)
  if (biggestSpender && biggestSpender.spent > avgSpending * 1.5) {
    templateKey = 'bigSpender';
    replacements.bigSpender = biggestSpender.name;
    replacements.bigSpenderSpent = formatMoney(biggestSpender.spent);
  }
  // Check for bargains
  else if (bargainCount >= 3) {
    templateKey = 'bargains';
    replacements.bargainCount = bargainCount;
  }
  // Check for expensive signing
  else if (expensiveSale && expensiveSale.soldFor >= 50000000) {
    templateKey = 'expensive';
    replacements.expensivePlayer = expensiveSale.name;
    replacements.expensivePrice = formatMoney(expensiveSale.soldFor);
  }
  // Check for squad builder
  else if (biggestSquad && biggestSquad.squadSize >= 10) {
    templateKey = 'squadBuilder';
    replacements.squadBuilder = biggestSquad.name;
    replacements.squadSize = biggestSquad.squadSize;
  }
  // Check if auction is competitive (spending is close)
  else if (teamSpending.length >= 2 && teamSpending[0].spent < teamSpending[1].spent * 1.3) {
    templateKey = 'competitive';
  }

  const templates = FABRIZIO_AUCTION_TEMPLATES[templateKey];
  let comment = random(templates);

  // Apply all replacements
  Object.entries(replacements).forEach(([key, value]) => {
    comment = comment.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });

  return comment;
}

// Get manager auction tweet - SITUATIONAL
export function getManagerAuctionTweet(managerId, teamStatus = 'neutral') {
  const tweetsByStatus = MANAGER_AUCTION_TWEETS[managerId];
  if (!tweetsByStatus) return null;

  const managerNames = {
    mourinho: { name: 'José Mourinho', handle: '@josemourinho', team: 'Real Madrid', title: 'Head Coach', teamId: 'real-madrid' },
    guardiola: { name: 'Pep Guardiola', handle: '@pepteam', team: 'Barcelona', title: 'Head Coach', teamId: 'barcelona' },
    flick: { name: 'Hansi Flick', handle: '@hansdieterflick', team: 'Bayern Munich', title: 'Head Coach', teamId: 'bayern' },
  };

  const tweets = tweetsByStatus[teamStatus] || tweetsByStatus.neutral;

  return {
    ...managerNames[managerId],
    tweet: random(tweets),
  };
}

// Get all manager tweets for auction milestone - WITH CONTEXT
export function getAllManagerAuctionTweets(context = {}) {
  const { teams = [] } = context;

  // Calculate team rankings
  const teamStats = teams.map(t => ({
    id: t.id,
    spent: (t.retainedPlayers?.reduce((s, p) => s + (p.retentionPrice || 0), 0) || 0) +
           (t.auctionedPlayers?.reduce((s, p) => s + (p.purchasePrice || 0), 0) || 0),
    squadSize: (t.retainedPlayers?.length || 0) + (t.auctionedPlayers?.length || 0),
    avgRating: calculateAvgRating(t),
  }));

  // Sort by squad quality (avg rating), then size
  teamStats.sort((a, b) => {
    if (Math.abs(b.avgRating - a.avgRating) > 2) return b.avgRating - a.avgRating;
    return b.squadSize - a.squadSize;
  });

  const getStatus = (teamId) => {
    const rank = teamStats.findIndex(t => t.id === teamId);
    if (rank === 0) return 'winning';
    if (rank >= teamStats.length - 2) return 'losing';
    return 'neutral';
  };

  return [
    getManagerAuctionTweet('mourinho', getStatus('real-madrid')),
    getManagerAuctionTweet('guardiola', getStatus('barcelona')),
    getManagerAuctionTweet('flick', getStatus('bayern')),
  ];
}

// Helper to calculate average squad rating
function calculateAvgRating(team) {
  const allPlayers = [...(team.retainedPlayers || []), ...(team.auctionedPlayers || [])];
  if (allPlayers.length === 0) return 0;
  const total = allPlayers.reduce((sum, p) => sum + (p.rating || 70), 0);
  return total / allPlayers.length;
}

// Pre-match hype
export const PRE_MATCH_HYPE = [
  "HUGE GAME ALERT! My sources tell me both teams will try to win! Exclusive!",
  "Here we go! Kick-off imminent! Both managers have confirmed: they want 3 points!",
  "Breaking: The players are on the pitch! Deal done with the referee! Match starting!",
  "EXCLUSIVE: Ball is round, game is 90 minutes. My sources confirm! Here we go!",
];

export function getPreMatchHype() {
  return random(PRE_MATCH_HYPE);
}

// Extra time commentary
export function getExtraTimeStartComment() {
  return random(FABRIZIO_EXTRA_TIME_START);
}

export function getExtraTimeHalftimeComment() {
  return random(FABRIZIO_EXTRA_TIME_HALFTIME);
}

export function getExtraTimeEndComment(homeTeam, awayTeam, homeGoals, awayGoals) {
  return random(FABRIZIO_EXTRA_TIME_END)
    .replace('{homeTeam}', homeTeam.name)
    .replace('{awayTeam}', awayTeam.name)
    .replace('{homeGoals}', homeGoals)
    .replace('{awayGoals}', awayGoals);
}

// Penalty commentary
export function getPenaltiesStartComment() {
  return random(FABRIZIO_PENALTIES_START);
}

export function getPenaltyScoredComment(player, homeScore, awayScore) {
  const score = `${homeScore}-${awayScore}`;
  return random(FABRIZIO_PENALTY_SCORED)
    .replace('{player}', player)
    .replace('{score}', score);
}

export function getPenaltyMissedComment(player, homeScore, awayScore) {
  const score = `${homeScore}-${awayScore}`;
  return random(FABRIZIO_PENALTY_MISSED)
    .replace('{player}', player)
    .replace('{score}', score);
}

export function getPenaltyWinnerComment(team, homeScore, awayScore) {
  return random(FABRIZIO_PENALTY_WINNER)
    .replace('{team}', team)
    .replace('{homeScore}', homeScore)
    .replace('{awayScore}', awayScore);
}
