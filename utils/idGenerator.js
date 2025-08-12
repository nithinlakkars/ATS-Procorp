// utils/idGenerator.js
export const generateCandidateId = (name = "") => {
  const timestamp = Date.now().toString().slice(-5); // Last 5 digits of timestamp
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 3); // First 3 initials

  return `${initials}_${timestamp}`;
};
