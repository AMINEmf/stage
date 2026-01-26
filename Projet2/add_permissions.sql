-- Ajouter les permissions pour les employés
INSERT IGNORE INTO `permissions` (`name`, `created_at`, `updated_at`) VALUES
('view_all_employes', NOW(), NOW()),
('create_employes', NOW(), NOW()),
('update_employes', NOW(), NOW()),
('delete_employes', NOW(), NOW());

-- Obtenir l'ID du rôle admin
SET @admin_role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1);

-- Obtenir les IDs des nouvelles permissions
SET @view_all_employes_id = (SELECT id FROM permissions WHERE name = 'view_all_employes' LIMIT 1);
SET @create_employes_id = (SELECT id FROM permissions WHERE name = 'create_employes' LIMIT 1);
SET @update_employes_id = (SELECT id FROM permissions WHERE name = 'update_employes' LIMIT 1);
SET @delete_employes_id = (SELECT id FROM permissions WHERE name = 'delete_employes' LIMIT 1);

-- Attacher les permissions au rôle admin
INSERT IGNORE INTO `permission_role` (`permission_id`, `role_id`) VALUES
(@view_all_employes_id, @admin_role_id),
(@create_employes_id, @admin_role_id),
(@update_employes_id, @admin_role_id),
(@delete_employes_id, @admin_role_id);
