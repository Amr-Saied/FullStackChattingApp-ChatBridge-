export interface RegisterModel {
  Username: string;
  Email: string;
  Password: string;
  DateOfBirth: string; // ISO date string format
  KnownAs?: string;
  Gender: string;
  City?: string;
  Country?: string;
}
