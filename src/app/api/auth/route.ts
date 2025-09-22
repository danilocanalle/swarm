import { NextRequest } from "next/server";
import {
  generateToken,
  isValidToken,
  addToken,
  removeToken,
  validatePassword,
} from "./utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, action } = body;

    switch (action) {
      case "login":
        if (validatePassword(password)) {
          const token = generateToken();
          addToken(token);

          console.log(`Login bem-sucedido. Token gerado: ${token}`);

          return Response.json({
            success: true,
            message: "Login realizado com sucesso",
            token: token,
          });
        } else {
          console.log("Tentativa de login com senha incorreta");
          return Response.json(
            {
              success: false,
              message: "Senha incorreta",
            },
            { status: 401 }
          );
        }

      case "validate":
        const { token } = body;
        const isValid = isValidToken(token);

        if (isValid) {
          return Response.json({
            success: true,
            message: "Token válido",
          });
        } else {
          return Response.json(
            {
              success: false,
              message: "Token inválido ou expirado",
            },
            { status: 401 }
          );
        }

      case "logout":
        const { token: logoutToken } = body;
        if (logoutToken) {
          removeToken(logoutToken);
          console.log(`Logout realizado. Token removido: ${logoutToken}`);
        }

        return Response.json({
          success: true,
          message: "Logout realizado com sucesso",
        });

      default:
        return Response.json(
          {
            success: false,
            message: "Ação não reconhecida",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Erro na API de autenticação:", error);
    return Response.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
