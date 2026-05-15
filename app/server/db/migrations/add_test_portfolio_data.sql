-- Add test data for portfolio and verified skills
-- Update this with your actual user ID

UPDATE users 
SET 
  portfolio_images = '["https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400", "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400", "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400"]',
  verified_skills = '["React", "Node.js", "TypeScript"]',
  availability_status = 'ouvert',
  bio = '**Développeur Full Stack** passionné par le *React* et le *Node.js*.

- Expert en JavaScript/TypeScript
- Créateur d''applications web modernes
- Ouvert aux collaborations

[GitHub](https://github.com)'
WHERE id = (SELECT id FROM users LIMIT 1);
