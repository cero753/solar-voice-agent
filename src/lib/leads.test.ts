import { describe, it, expect } from 'vitest'
import { normalizeLead, evaluateQualification } from './leads'

describe('evaluateQualification (script DQ gates)', () => {
  it('books a good single-family homeowner with a high bill', () => {
    expect(evaluateQualification({ ownsRoof: true, homeType: 'single-family', monthlyBill: 240 })).toBe('')
  })
  it('DQs a renter (does not own roof)', () => {
    expect(evaluateQualification({ ownsRoof: false, homeType: 'single-family', monthlyBill: 240 })).toMatch(/own/i)
  })
  it('DQs a condo without roof ownership', () => {
    expect(evaluateQualification({ ownsRoof: null, homeType: 'condo', monthlyBill: 300 })).toMatch(/condo/i)
  })
  it('DQs a low monthly bill', () => {
    expect(evaluateQualification({ ownsRoof: true, homeType: 'single-family', monthlyBill: 40 })).toMatch(/below/i)
  })
})

describe('normalizeLead', () => {
  it('coerces loose voice-model fields and books a qualified lead', () => {
    const lead = normalizeLead(
      {
        name: 'Jane Doe',
        phone: '555-1212',
        monthlyBill: '$220/mo',
        homeType: 'Single Family Home',
        ownsRoof: 'yes',
        creditAbove650: 'Yes',
        appointmentType: 'in home',
      },
      { createdAt: '2026-07-28T10:00:00.000Z' },
    )
    expect(lead.status).toBe('booked')
    expect(lead.monthlyBill).toBe(220)
    expect(lead.homeType).toBe('single-family')
    expect(lead.ownsRoof).toBe(true)
    expect(lead.creditAbove650).toBe('yes')
    expect(lead.appointmentType).toBe('in-home')
  })

  it('marks disqualified when the gate fails, regardless of stated status', () => {
    const lead = normalizeLead({ ownsRoof: 'renter', homeType: 'condo', monthlyBill: 90, status: 'booked' })
    expect(lead.status).toBe('disqualified')
    expect(lead.disqualReason).toBeTruthy()
  })
})
