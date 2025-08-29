import Neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
dotenv.config();

async function crearCalendarioYRelaciones() {
    const driver = Neo4j.driver(process.env.NEO4J_URI, 
        Neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));
    const session = driver.session();

    try {
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-12-31');
        
        // Crear array de todos los días con su servicio correspondiente
        const days = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dateString = currentDate.toISOString().split('T')[0];
            const dayOfWeek = currentDate.getDay();
            
            let serviceName = null;
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                serviceName = 'LUNES A VIERNES';
            } else if (dayOfWeek === 6) {
                serviceName = 'SABADOS';
            } else if (dayOfWeek === 0) {
                serviceName = 'DOMINGOS';
            }

            if (serviceName) {
                days.push({ dateString, serviceName });
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Consulta única con UNWIND para mejor performance
        const query = `
            UNWIND $days AS day
            MERGE (cd:CalendarDate {date: day.dateString})
            ON CREATE SET cd.id = randomUUID()
            WITH cd, day.serviceName AS serviceName
            MATCH (s:Service {name: serviceName})
            MERGE (s)-[:HAS_CALENDAR_DATE]->(cd)
            RETURN count(*) AS total
        `;

        const result = await session.run(query, { days });
        const total = result.records[0].get('total').toNumber();
        
        console.log(`Total relaciones creadas: ${total}`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await session.close();
        await driver.close();
    }
}

// Ejecutar la función
crearCalendarioYRelaciones();

/*1. Eliminar TODAS las fechas pasadas:
MATCH (n:CalendarDate) 
WHERE date(n.date) < date() 
DETACH DELETE n
RETURN count(n) AS nodos_eliminados;
*/