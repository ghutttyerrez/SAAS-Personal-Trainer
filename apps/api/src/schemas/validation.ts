import { z } from "zod";

// Schemas de parâmetros
export const idParamSchema = z.object({
  id: z.string().uuid("ID deve ser um UUID válido"),
});

export const clientIdParamSchema = z.object({
  clientId: z.string().uuid("Client ID deve ser um UUID válido"),
});

// Schemas de autenticação
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome deve ter no máximo 100 caracteres"),
    email: z
      .string()
      .email("Email deve ter um formato válido")
      .max(255, "Email deve ter no máximo 255 caracteres"),
    password: z
      .string()
      .min(6, "Senha deve ter pelo menos 6 caracteres")
      .max(100, "Senha deve ter no máximo 100 caracteres"),
    tenant_name: z
      .string()
      .min(2, "Nome do tenant deve ter pelo menos 2 caracteres")
      .max(100, "Nome do tenant deve ter no máximo 100 caracteres"),
  })
  .transform((data) => {
    // Divide o nome em firstName e lastName
    const nameParts = data.name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;

    return {
      email: data.email,
      password: data.password,
      firstName,
      lastName,
      tenantName: data.tenant_name,
    };
  });

export const loginSchema = z.object({
  email: z.string().email("Email deve ter um formato válido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token é obrigatório"),
});

// Schemas de clientes
// Schemas de clientes (alinhados ao schema do banco)
export const createClientBodySchema = z.object({
  userId: z.string().uuid("User ID deve ser um UUID válido"),
  date_of_birth: z
    .string()
    .datetime("Data de nascimento deve estar no formato ISO 8601")
    .optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  height: z.number().min(0).max(300).optional(),
  weight: z.number().min(0).max(500).optional(),
  fitness_goal: z.string().max(2000).optional(),
  medical_conditions: z.string().max(2000).optional(),
  emergency_contact_name: z.string().max(255).optional(),
  emergency_contact_phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s\-\(\)]{10,20}$/.test(val),
      "Telefone deve ter um formato válido"
    ),
  emergency_contact_relationship: z.string().max(100).optional(),
  is_active: z.boolean().optional(),
});

export const updateClientBodySchema = createClientBodySchema
  .omit({ userId: true })
  .partial();

// Schemas de exercícios
export const createExerciseSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  description: z
    .string()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .optional(),
  muscle_group: z
    .string()
    .min(2, "Grupo muscular deve ter pelo menos 2 caracteres")
    .max(50, "Grupo muscular deve ter no máximo 50 caracteres"),
  equipment: z
    .string()
    .max(100, "Equipamento deve ter no máximo 100 caracteres")
    .optional(),
  instructions: z
    .string()
    .max(2000, "Instruções devem ter no máximo 2000 caracteres")
    .optional(),
});

// Schemas de treinos
export const workoutExerciseSchema = z.object({
  exercise_id: z.string().uuid("Exercise ID deve ser um UUID válido"),
  sets: z
    .number()
    .int("Sets deve ser um número inteiro")
    .min(1, "Sets deve ser pelo menos 1")
    .max(20, "Sets deve ser no máximo 20"),
  reps: z
    .number()
    .int("Reps deve ser um número inteiro")
    .min(1, "Reps deve ser pelo menos 1")
    .max(100, "Reps deve ser no máximo 100"),
  weight: z
    .number()
    .min(0, "Peso deve ser maior ou igual a 0")
    .max(1000, "Peso deve ser no máximo 1000kg")
    .optional(),
  rest_time: z
    .number()
    .int("Tempo de descanso deve ser um número inteiro")
    .min(0, "Tempo de descanso deve ser maior ou igual a 0")
    .max(600, "Tempo de descanso deve ser no máximo 600 segundos")
    .optional(),
  notes: z
    .string()
    .max(500, "Notas devem ter no máximo 500 caracteres")
    .optional(),
});

export const createWorkoutSchema = z.object({
  client_id: z.string().uuid("Client ID deve ser um UUID válido"),
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  description: z
    .string()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .optional(),
  scheduled_date: z
    .string()
    .datetime("Data agendada deve estar no formato ISO 8601")
    .optional(),
  exercises: z
    .array(workoutExerciseSchema)
    .min(1, "Treino deve ter pelo menos 1 exercício")
    .max(20, "Treino deve ter no máximo 20 exercícios"),
});

export const updateWorkoutSchema = createWorkoutSchema.partial();

// Schemas de progresso
export const progressMeasurementSchema = z.object({
  type: z.enum(
    [
      "weight",
      "body_fat",
      "muscle_mass",
      "chest",
      "waist",
      "hips",
      "bicep",
      "thigh",
    ],
    {
      message: "Tipo de medição inválido",
    }
  ),
  value: z
    .number()
    .min(0, "Valor deve ser maior ou igual a 0")
    .max(1000, "Valor deve ser no máximo 1000"),
  unit: z
    .string()
    .min(1, "Unidade é obrigatória")
    .max(10, "Unidade deve ter no máximo 10 caracteres"),
});

export const createProgressSchema = z.object({
  client_id: z.string().uuid("Client ID deve ser um UUID válido"),
  date: z.string().datetime("Data deve estar no formato ISO 8601"),
  notes: z
    .string()
    .max(1000, "Notas devem ter no máximo 1000 caracteres")
    .optional(),
  measurements: z
    .array(progressMeasurementSchema)
    .min(1, "Progresso deve ter pelo menos 1 medição")
    .max(20, "Progresso deve ter no máximo 20 medições"),
});

export const updateProgressSchema = createProgressSchema.partial();

// Schemas de chat
export const createDirectRoomSchema = z.object({
  clientId: z.string().uuid("Client ID deve ser um UUID válido"),
});

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Conteúdo da mensagem é obrigatório")
    .max(2000, "Mensagem deve ter no máximo 2000 caracteres"),
  roomId: z.string().uuid("Room ID deve ser um UUID válido"),
});

export const markAsReadSchema = z.object({
  messageId: z.string().uuid("Message ID deve ser um UUID válido"),
});

// Schemas de query
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, "Page deve ser um número")
    .transform(Number)
    .refine((val) => val >= 1, "Page deve ser maior que 0")
    .optional()
    .default(1),
  limit: z
    .string()
    .regex(/^\d+$/, "Limit deve ser um número")
    .transform(Number)
    .refine((val) => val >= 1 && val <= 100, "Limit deve estar entre 1 e 100")
    .optional()
    .default(10),
});

export const dateRangeQuerySchema = z
  .object({
    startDate: z
      .string()
      .datetime("Start date deve estar no formato ISO 8601")
      .optional(),
    endDate: z
      .string()
      .datetime("End date deve estar no formato ISO 8601")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: "Start date deve ser anterior ou igual a end date",
      path: ["startDate"],
    }
  );
