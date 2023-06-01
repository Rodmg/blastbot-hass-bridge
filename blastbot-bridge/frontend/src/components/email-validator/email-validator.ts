import { FormControl } from '@angular/forms';

export function validateEmailString(email: string) {
  let EMAIL_REGEXP = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;

  return EMAIL_REGEXP.test(email);
}

export function validateEmail(c: FormControl) {
  return validateEmailString(c.value)
    ? null
    : {
        validateEmail: {
          valid: false,
        },
      };
}
