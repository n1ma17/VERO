import { computed, ref } from 'vue'
import { api } from '@/api/http'
import {
  clearCompanyLogos,
  evictCompanyLogo,
  setCompanyLogoCache,
} from '@/composables/useCompanyLogos'
import type { Company, NewCompany } from '@/types/company'
import { OTHERS_COMPANY_LABEL } from '@/types/company'

type CompanyApi = {
  id: string
  name: string
  hasLogo: boolean
  createdAt: string
}

const companies = ref<Company[]>([])

export async function loadCompanies(): Promise<void> {
  const rows = await api<CompanyApi[]>('/api/companies')
  companies.value = rows
}

export function clearCompanies(): void {
  companies.value = []
  clearCompanyLogos()
}

export function getCompaniesSnapshot(): Company[] {
  return companies.value
}

function normalizeCompanyName(name: string): string {
  return name.trim().toLowerCase()
}

export function isCompanyNameTaken(name: string, exceptId?: string | null): boolean {
  const norm = normalizeCompanyName(name)
  if (!norm) return false
  return companies.value.some(
    (row) => row.id !== exceptId && normalizeCompanyName(row.name) === norm,
  )
}

export function useCompanies() {
  const sorted = computed(() =>
    [...companies.value].sort((a, b) => a.name.localeCompare(b.name)),
  )

  function getCompanyById(id: string | null | undefined): Company | undefined {
    if (!id) return undefined
    return companies.value.find((row) => row.id === id)
  }

  function companyLabel(id: string | null | undefined): string {
    if (!id) return OTHERS_COMPANY_LABEL
    return getCompanyById(id)?.name ?? OTHERS_COMPANY_LABEL
  }

  async function addCompany(input: NewCompany): Promise<Company> {
    const row = await api<CompanyApi>('/api/companies', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name.trim(),
        logoUrl: input.logoUrl ?? undefined,
      }),
    })
    if (input.logoUrl) setCompanyLogoCache(row.id, input.logoUrl)
    companies.value = [...companies.value, row]
    return row
  }

  async function updateCompany(
    id: string,
    input: NewCompany,
  ): Promise<Company | null> {
    const row = await api<CompanyApi>(`/api/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: input.name.trim(),
        logoUrl: input.logoUrl === undefined ? undefined : input.logoUrl,
      }),
    })
    if (input.logoUrl) setCompanyLogoCache(id, input.logoUrl)
    else if (input.logoUrl === null) {
      evictCompanyLogo(id)
      setCompanyLogoCache(id, null)
    }
    companies.value = companies.value.map((item) => (item.id === id ? row : item))
    return row
  }

  async function removeCompany(id: string): Promise<void> {
    await api(`/api/companies/${id}`, { method: 'DELETE' })
    evictCompanyLogo(id)
    companies.value = companies.value.filter((item) => item.id !== id)
  }

  return {
    companies: sorted,
    getCompanyById,
    companyLabel,
    isCompanyNameTaken: (name: string, exceptId?: string | null) =>
      isCompanyNameTaken(name, exceptId),
    addCompany,
    updateCompany,
    removeCompany,
  }
}
