export const validatePartialRoomId = (roomId: string) => {
  return /^\d*$/.test(roomId);
};

export const validateFullRoomId = (roomId: string) => {
  return /^[0-9]{6}$/.test(roomId);
};

export const createUserId = () => {
  return crypto.randomUUID();
};
