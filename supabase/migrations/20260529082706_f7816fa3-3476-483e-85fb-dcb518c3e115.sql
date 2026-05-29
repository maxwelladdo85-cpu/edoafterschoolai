UPDATE auth.users
SET encrypted_password = crypt('edosubeb123', gen_salt('bf')),
    updated_at = now()
WHERE email = 'maxwelladdo85@gmail.com';