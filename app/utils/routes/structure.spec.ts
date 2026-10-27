import { describe, test, expect } from 'vitest'
import { routes } from './structure'

describe('structure routes', () => {
  test('AppPartners path returns /app/partners', () => {
    expect(routes.AppPartners.path()).toBe('/app/partners')
  })

  test('AppStructure path returns /app/structure', () => {
    expect(routes.AppStructure.path()).toBe('/app/structure')
  })

  test('AppStructureUsers path returns /app/structure/users', () => {
    expect(routes.AppStructureUsers.path()).toBe('/app/structure/users')
  })

  test('AppStructureTypeSurvey path returns /app/structure/structure-type', () => {
    expect(routes.AppStructureTypeSurvey.path()).toBe(
      '/app/structure/structure-type'
    )
  })

  test('AppStructureInfo path returns /app/structure/info', () => {
    expect(routes.AppStructureInfo.path()).toBe('/app/structure/info')
  })

  test('AppStructureCustomObjects path returns /app/structure/custom-objects', () => {
    expect(routes.AppStructureCustomObjects.path()).toBe(
      '/app/structure/custom-objects'
    )
  })

  test('AppStructureEdit path returns /app/structure/edit', () => {
    expect(routes.AppStructureEdit.path()).toBe('/app/structure/edit')
  })

  test('AppStructureSocialSupportSubjectsEdit path returns /app/structure/custom-objects/social-support-subjects/edit', () => {
    expect(routes.AppStructureSocialSupportSubjectsEdit.path()).toBe(
      '/app/structure/custom-objects/social-support-subjects/edit'
    )
  })

  test('AppStructureUserEdit path returns /app/structure/users/:userId/edit', () => {
    expect(routes.AppStructureUserEdit.path('user-1')).toBe(
      '/app/structure/users/user-1/edit'
    )
  })

  test('AppStructureUserEdit title returns formatted title', () => {
    expect(routes.AppStructureUserEdit.title('Jean Dupont')).toBe(
      'Modifier le compte de Jean Dupont'
    )
  })

  test('AppStructureUserDelete path returns /app/structure/users/:userId/delete', () => {
    expect(routes.AppStructureUserDelete.path('user-1')).toBe(
      '/app/structure/users/user-1/delete'
    )
  })

  test('AppStructureUserDelete title returns formatted title', () => {
    expect(routes.AppStructureUserDelete.title('Jean Dupont')).toBe(
      'Supprimer le compte de Jean Dupont'
    )
  })

  test('AppStructureUserAdd path returns /app/structure/users/add', () => {
    expect(routes.AppStructureUserAdd.path()).toBe('/app/structure/users/add')
  })

  test('AppStructureDora path returns /app/structure/dora', () => {
    expect(routes.AppStructureDora.path()).toBe('/app/structure/dora')
  })
})
