-- Seed admin user (password: Admin123!)
insert into app_users (username, display_name, password_hash, is_active)
values ('admin', 'Admin', '$2a$10$R6aD8zZag7q6CdYb1QzyCuQnDaTgXhJeoG7ZZTFspgtPBlqBiJfUm', true);

insert into user_roles (user_id, app_key, role)
select id, 'portal', 'admin' from app_users where username = 'admin';
insert into user_roles (user_id, app_key, role)
select id, 'inventory', 'admin' from app_users where username = 'admin';
insert into user_roles (user_id, app_key, role)
select id, 'crm', 'admin' from app_users where username = 'admin';
insert into user_roles (user_id, app_key, role)
select id, 'users', 'admin' from app_users where username = 'admin';
