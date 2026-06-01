export type GroupMemberRole = 'MEMBER' | 'ADMIN';

export interface GroupMember {
  userId: string;
  role: GroupMemberRole;
  joinedAt: string;
  invitedBy: string;
  // populated
  username?: string;
  email?: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupTournament {
  _id: string;
  groupId: string;
  tournamentId: number;
  addedBy: string;
  createdAt: string;
}

export type GroupInvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface GroupInvitation {
  _id: string;
  groupId: string;
  invitedUserId: string;
  invitedBy: string;
  status: GroupInvitationStatus;
  expiresAt: string;
  createdAt: string;
  // populated
  groupName?: string;
  invitedByUsername?: string;
}

export type TournamentExternalAccessStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED' | 'REJECTED';

export interface TournamentExternalAccess {
  _id: string;
  groupId: string;
  tournamentId: number;
  invitedBy: string;
  email: string | null;
  displayName: string | null;
  userId: string | null;
  accessToken?: string;
  magicLinkToken?: string;
  status: TournamentExternalAccessStatus;
  expiresAt: string;
  createdAt: string;
}

export interface GroupMagicLink {
  _id: string;
  groupId: string;
  tournamentId: number;
  createdBy: string;
  token: string;
  isActive: boolean;
  createdAt: string;
}
