export interface PhotoDTO {
  id: number;
  url?: string;
  isMain: boolean;
}

export interface Member {
  id: number;
  userName?: string;
  role?: string;
  photoUrl?: string;
  dateOfBirth: Date;
  knownAs?: string;
  created: Date;
  lastActive: Date;
  lastActiveStatus?: string;
  gender?: string;
  introduction?: string;
  lookingFor?: string;
  interests?: string;
  city?: string;
  country?: string;
  age: number;
  photos?: PhotoDTO[];
}
