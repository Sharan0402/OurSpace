import type { ChatMessage, Conversation, Track, User } from "@/types";

/**
 * Mock data used when NEXT_PUBLIC_USE_MOCKS=true so the UI runs with no
 * backend. The shapes match what the Java/DynamoDB backend returns.
 *
 * The two authorized users of Our Space.
 */
export const MOCK_USERS: Record<string, User> = {
  you: {
    id: "user_you",
    displayName: "You",
    avatarUrl: undefined,
    isSelf: true,
  },
  partner: {
    id: "user_partner",
    displayName: "Amara",
    avatarUrl: undefined,
    isSelf: false,
  },
};

export const CURRENT_USER: User = MOCK_USERS.you;
export const PARTNER_USER: User = MOCK_USERS.partner;

export const MOCK_CONVERSATION: Conversation = {
  id: "conv_our_space",
  participantIds: [MOCK_USERS.you.id, MOCK_USERS.partner.id],
  title: "Our Space",
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  lastMessagePreview: "listening to our song 🎶",
  lastMessageAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
};

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    conversationId: MOCK_CONVERSATION.id,
    senderId: PARTNER_USER.id,
    body: "good morning my love 🌤️ did you sleep okay?",
    createdAt: minutesAgo(240),
    status: "read",
  },
  {
    id: "m2",
    conversationId: MOCK_CONVERSATION.id,
    senderId: CURRENT_USER.id,
    body: "morning 💛 dreamt about our trip. miss you already",
    createdAt: minutesAgo(238),
    status: "read",
  },
  {
    id: "m3",
    conversationId: MOCK_CONVERSATION.id,
    senderId: PARTNER_USER.id,
    body: "only 12 more days until I see you",
    createdAt: minutesAgo(60),
    status: "read",
  },
  {
    id: "m4",
    conversationId: MOCK_CONVERSATION.id,
    senderId: CURRENT_USER.id,
    body: "put on our playlist? want to listen together tonight",
    createdAt: minutesAgo(6),
    status: "delivered",
  },
  {
    id: "m5",
    conversationId: MOCK_CONVERSATION.id,
    senderId: PARTNER_USER.id,
    body: "listening to our song 🎶 come join me",
    createdAt: minutesAgo(5),
    status: "read",
  },
];

export const MOCK_TRACKS: Track[] = [
  {
    uri: "spotify:track:0tgVpDi06FyKpA1z0VMD4v",
    id: "0tgVpDi06FyKpA1z0VMD4v",
    name: "Perfect",
    artists: [{ id: "6eUKZXaKkcviH0Ku9w2n3V", name: "Ed Sheeran" }],
    albumName: "÷ (Divide)",
    albumArtUrl:
      "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
    durationMs: 263400,
  },
  {
    uri: "spotify:track:6habFhsOp2NvshLv26DqMb",
    id: "6habFhsOp2NvshLv26DqMb",
    name: "Adore You",
    artists: [{ id: "6KImCVD70vtIoJWnq6nGn3", name: "Harry Styles" }],
    albumName: "Fine Line",
    albumArtUrl:
      "https://i.scdn.co/image/ab67616d0000b273277b5dd66517588d9df8ea2b",
    durationMs: 207133,
  },
  {
    uri: "spotify:track:1BxfuPKGuaTgP7aM0Bbdwr",
    id: "1BxfuPKGuaTgP7aM0Bbdwr",
    name: "Cruel Summer",
    artists: [{ id: "06HL4z0CvFAxyc27GXpf02", name: "Taylor Swift" }],
    albumName: "Lover",
    albumArtUrl:
      "https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647",
    durationMs: 178426,
  },
  {
    uri: "spotify:track:3AJwUDP919kvQ9QcozQPxg",
    id: "3AJwUDP919kvQ9QcozQPxg",
    name: "Yellow",
    artists: [{ id: "4gzpq5DPGxSnKTe4SA8HAU", name: "Coldplay" }],
    albumName: "Parachutes",
    albumArtUrl:
      "https://i.scdn.co/image/ab67616d0000b273de09e02aa7febf30b7c02d82",
    durationMs: 266773,
  },
];
