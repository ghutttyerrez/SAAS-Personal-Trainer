describe("Validation Schemas", () => {
  describe("Basic schema tests", () => {
    it("deve importar schemas sem erro", () => {
      expect(require("../../schemas/validation")).toBeDefined();
    });

    it("deve ter createClientSchema definido", () => {
      const { createClientSchema } = require("../../schemas/validation");
      expect(createClientSchema).toBeDefined();
    });

    it("deve ter loginSchema definido", () => {
      const { loginSchema } = require("../../schemas/validation");
      expect(loginSchema).toBeDefined();
    });

    it("deve ter registerSchema definido", () => {
      const { registerSchema } = require("../../schemas/validation");
      expect(registerSchema).toBeDefined();
    });
  });
});
