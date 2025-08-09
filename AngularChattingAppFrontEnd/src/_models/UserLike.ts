export interface UserLike {
  id: number;
  sourceUserId: number;
  likedUserId: number;
  created: string;
  likedUserName?: string;
  likedUserPhotoUrl?: string;
  sourceUserName?: string;
  sourceUserPhotoUrl?: string;
}
