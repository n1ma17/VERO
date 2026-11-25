export interface Company {
  id: string
  name: string
  hasLogo: boolean
  createdAt: string
}

export type NewCompany = {
  name: string
  logoUrl?: string | null
}

/** Sentinel for bills with no company. */
export const OTHERS_COMPANY_ID = ''

export const OTHERS_COMPANY_LABEL = 'Others'
