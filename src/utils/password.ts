const passwordRule =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export function getPasswordValidationMessage(password: string) {
  if (!passwordRule.test(password)) {
    return "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and symbol.";
  }

  return undefined;
}
