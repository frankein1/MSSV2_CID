import { describe, test, expect } from 'vitest'
import { routes } from './admin'

describe('admin routes', () => {
  test('Admin path returns /admin', () => {
    expect(routes.Admin.path()).toBe('/admin')
  })

  test('AdminOverview path returns /admin/overview', () => {
    expect(routes.AdminOverview.path()).toBe('/admin/overview')
  })

  test('AdminLogin path returns empty string', () => {
    expect(routes.AdminLogin.path()).toBe('')
  })

  test('AdminStructures path returns /admin/structures', () => {
    expect(routes.AdminStructures.path()).toBe('/admin/structures')
  })

  test('AdminStructure path returns /admin/structures/:structureId', () => {
    expect(routes.AdminStructure.path('struct-1')).toBe(
      '/admin/structures/struct-1'
    )
  })

  test('AdminStructureSubjects path returns /admin/structures/:structureId/subjects', () => {
    expect(routes.AdminStructureSubjects.path('struct-1')).toBe(
      '/admin/structures/struct-1/subjects'
    )
  })

  test('AdminUsers path returns /admin/users', () => {
    expect(routes.AdminUsers.path()).toBe('/admin/users')
  })

  test('AdminStructureAdd path returns /admin/structures/add', () => {
    expect(routes.AdminStructureAdd.path()).toBe('/admin/structures/add')
  })

  test('AdminStructureEdit path returns /admin/structures/:structureId/edit', () => {
    expect(routes.AdminStructureEdit.path('structure-1')).toBe(
      '/admin/structures/structure-1/edit'
    )
  })

  test('AdminUsersAdd path returns /admin/users/add', () => {
    expect(routes.AdminUsersAdd.path()).toBe('/admin/users/add')
  })

  test('AdminUser path returns /admin/users/:userId', () => {
    expect(routes.AdminUser.path('user-1')).toBe('/admin/users/user-1')
  })

  test('AdminEmails path returns /admin/emails', () => {
    expect(routes.AdminEmails.path()).toBe('/admin/emails')
  })

  test('AdminMinisters path returns /admin/ministers', () => {
    expect(routes.AdminMinisters.path()).toBe('/admin/ministers')
  })

  test('AdminMinisterAdd path returns /admin/ministers/add', () => {
    expect(routes.AdminMinisterAdd.path()).toBe('/admin/ministers/add')
  })

  test('AdminMinisterEdit path returns /admin/ministers/:ministerId/edit', () => {
    expect(routes.AdminMinisterEdit.path('minister-1')).toBe(
      '/admin/ministers/minister-1/edit'
    )
  })
})
