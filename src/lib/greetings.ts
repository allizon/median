export type GreetingTemplate = {
  before: string;
  after: string;
};

const GREETINGS: GreetingTemplate[] = [
  { before: "Welcome, ", after: "! What do you want to watch next?" },
  { before: "Hey ", after: ", ready to find your next favorite?" },
  { before: "Welcome, ", after: "! Let's find something great to watch." },
  { before: "What's up, ", after: "? Time to add to your wishlist?" },
  { before: "Hey ", after: ", let's discover what to watch next." },
  { before: "Welcome, ", after: "! Time to find something amazing." },
];

export function getRandomGreeting(): GreetingTemplate {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}
