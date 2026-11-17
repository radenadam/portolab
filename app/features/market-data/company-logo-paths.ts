export const companyLogosPrefix = "/company-logos";

export function companyLogoFileName(code: string): string {
  return `${code}.png`;
}

export function companyLogoPath(code: string): string {
  return `${companyLogosPrefix}/${companyLogoFileName(code)}`;
}
