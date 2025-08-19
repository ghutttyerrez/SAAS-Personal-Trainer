-- Idempotent seed for exercises table
-- Inserts common exercises only if they do not already exist by name

INSERT INTO exercises (name, description, category, muscle_groups, equipment, instructions)
SELECT * FROM (
    VALUES
    ('Flexão de Braço', 'Exercício para fortalecer peitorais, tríceps e ombros', 'Peito', ARRAY['Peitoral', 'Tríceps', 'Deltoides']::text[], ARRAY[]::text[], ARRAY['Deite-se de bruços', 'Apoie as mãos no chão', 'Empurre o corpo para cima', 'Desça controladamente']::text[]),
    ('Agachamento', 'Exercício fundamental para membros inferiores', 'Pernas', ARRAY['Quadríceps', 'Glúteos', 'Posterior']::text[], ARRAY[]::text[], ARRAY['Fique em pé com pés afastados', 'Desça como se fosse sentar', 'Mantenha o peito ereto', 'Retorne à posição inicial']::text[]),
    ('Prancha', 'Exercício isométrico para core', 'Core', ARRAY['Abdômen', 'Core']::text[], ARRAY[]::text[], ARRAY['Posição de flexão', 'Apoie nos antebraços', 'Mantenha o corpo reto', 'Contraia o abdômen']::text[]),
    ('Burpee', 'Exercício cardiovascular completo', 'Cardio', ARRAY['Corpo todo']::text[], ARRAY[]::text[], ARRAY['Agachamento', 'Flexão', 'Salto vertical', 'Repetir sequência']::text[]),
    ('Rosca Direta', 'Exercício para bíceps', 'Braços', ARRAY['Bíceps']::text[], ARRAY['Halteres']::text[], ARRAY['Segure os halteres', 'Flexione os cotovelos', 'Contraia os bíceps', 'Desça controladamente']::text[])
) AS v(name, description, category, muscle_groups, equipment, instructions)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises e WHERE e.name = v.name
);
