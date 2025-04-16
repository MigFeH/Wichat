import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._
import scala.language.postfixOps

class WeChatSimulation extends Simulation {

  // --- CONFIGURACIÓN ---
  val loginUsername = "Test"
  val loginPassword = "123"

  // URLs base para los microservicios backend
  val authBaseUrl = "http://localhost:8002"      // Puerto para /login
  val userStatsBaseUrl = "http://localhost:8001" // Puerto para /api/stats

  // Configuración del protocolo HTTP para Gatling
  val httpProtocol = http
    // No definimos un baseUrl global ya que llamamos a diferentes bases
    .acceptHeader("application/json, text/plain, */*") // Cabeceras estándar
    .acceptEncodingHeader("gzip, deflate")
    .acceptLanguageHeader("en-US,en;q=0.5")
    .userAgentHeader("Gatling/3.10.5") // Puedes actualizar la versión si usas un Gatling más nuevo
    .contentTypeHeader("application/json") // Indica que enviaremos JSON por defecto

  // --- ESCENARIO DE USUARIO ---
  // Define el flujo de acciones que simulará cada usuario virtual
  val scn = scenario("WeChat API User Flow (Login + Stats)")

    // Paso 1: Autenticación contra el servicio de autenticación
    .exec(
      http("API Login Request") // Nombre de la petición en los reportes
        .post(authBaseUrl + "/login") // Construye la URL completa: http://localhost:8002/login
        .body(StringBody(s"""{"username": "$loginUsername", "password": "$loginPassword"}""")).asJson // Cuerpo JSON con credenciales
        .check(status.is(200).saveAs("loginHttpStatus")) // Verifica respuesta 200 OK y guarda el status
        .check(jsonPath("$.token").exists.saveAs("authToken")) // Extrae el token JWT de la respuesta y lo guarda en la sesión como 'authToken'
        .check(jsonPath("$.username").is(loginUsername)) // Verifica que el username en la respuesta coincide
    )

    // Paso Intermedio: Guardar el username en la sesión para usarlo después
    .exec(session => {
      // Este bloque permite ejecutar código Scala dentro del escenario
      // Guardamos el username para usarlo en la llamada a estadísticas
      session.set("loggedInUsername", loginUsername)
    })

    // Pausa: Simula el tiempo que un usuario espera después de loguearse
    .pause(2 seconds, 4 seconds) // Pausa aleatoria entre 2 y 4 segundos

    // Paso 2: Petición a un endpoint protegido (Estadísticas) en el servicio de usuario/stats
    .exec(
      http("API Get Statistics Request") // Nombre de la petición
        .get(userStatsBaseUrl + "/api/stats") // Construye la URL completa: http://localhost:8001/api/stats
        .queryParam("username", "${loggedInUsername}") // Añade ?username=Test (usando el valor de la sesión) a la URL
        .header("Authorization", "Bearer ${authToken}") // Añade la cabecera de autorización con el token guardado
        .check(status.is(200)) // Verifica respuesta 200 OK
        .check(jsonPath("$").exists) // Verifica que la respuesta contiene algún cuerpo JSON (asumiendo que devuelve un array o un objeto)
        // Opcional: verificación más específica si se sabe que devuelve un array de stats:
        // .check(jsonPath("$[0].username").is(loginUsername))
    )

    // Pausa: Simula el tiempo que un usuario pasa viendo la página de estadísticas
    .pause(3 seconds)

  // --- CONFIGURACIÓN DE LA CARGA ---
  // Definimos cuántos usuarios y cómo se inyectan en el escenario
  setUp(
    scn.inject(
      // Perfil de carga:
      atOnceUsers(1), // Inyecta 1 usuario inmediatamente al inicio
      rampUsers(14).during(30 seconds) // Inyecta gradualmente 14 usuarios más a lo largo de 30 segundos (total 15 usuarios)
      // Puedes experimentar con otros perfiles:
      // constantUsersPerSec(2).during(1 minute) // 2 usuarios nuevos cada segundo durante 1 minuto
      // rampUsers(50).during(1 minute) // 50 usuarios gradualmente en 1 minuto
    ).protocols(httpProtocol) // Asocia el escenario con la configuración HTTP definida
  ).assertions(
    // Criterios globales para determinar si la prueba pasa o falla:
    global.responseTime.max.lt(5000),      // El tiempo máximo de cualquier respuesta debe ser menor a 5000 ms (5 segundos)
    global.successfulRequests.percent.gt(97) // El porcentaje de peticiones exitosas (status 2xx o 3xx) debe ser mayor al 97%
  )
}