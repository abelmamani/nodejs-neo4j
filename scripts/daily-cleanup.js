import neo4j from 'neo4j-driver';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function sendEmail(subject, htmlContent) {
    // CORRECCIÓN: createTransport en lugar de createTransporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
        subject: subject,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('📧 Email enviado correctamente');
    } catch (error) {
        console.error('❌ Error enviando email:', error);
    }
}

async function dailyCleanup() {
    const driver = neo4j.driver(
        process.env.NEO4J_URI,
        neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
    );
    
    const session = driver.session();
    
    try {
        console.log('🔄 Ejecutando limpieza diaria...');
        console.log('⏰ Fecha:', new Date().toISOString());
        
        const query = `
            // Eliminar fecha de ayer
            MATCH (n:CalendarDate {date: toString(date() - duration('P1D'))}) 
            DETACH DELETE n
            WITH count(n) AS nodos_eliminados

            // Buscar servicio para hoy
            OPTIONAL MATCH (hoy:CalendarDate {date: toString(date())})
            OPTIONAL MATCH (s:Service)-[:HAS_CALENDAR_DATE]->(hoy)
            RETURN 
                nodos_eliminados,
                COALESCE(hoy.date, "No existe fecha de hoy") AS fecha_hoy,
                COALESCE(s.name, "❌ No hay servicio programado") AS servicio_hoy,
                CASE 
                    WHEN s.name IS NOT NULL THEN "✅ Servicio activo" 
                    ELSE "⚠️  Sin servicio programado" 
                END AS estado
        `;
        
        const result = await session.run(query);
        const record = result.records[0];
        
        const nodosEliminados = record.get('nodos_eliminados');
        const fechaHoy = record.get('fecha_hoy');
        const servicioHoy = record.get('servicio_hoy');
        const estado = record.get('estado');

        // Mostrar en consola
        console.log('📊 REPORTE DIARIO:');
        console.log(`🗑️  Nodos eliminados: ${nodosEliminados}`);
        console.log(`📅 Fecha de hoy: ${fechaHoy}`);
        console.log(`🏢 Servicio de hoy: ${servicioHoy}`);
        console.log(`🔰 Estado: ${estado}`);

        // ENVIO DE EMAIL 
        const emailSubject = `📊 Reporte Diario Servicio Macbus App - ${new Date().toLocaleDateString()}`;
        
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin: 10px 0; }
                    .success { background-color: #d4edda; border-color: #c3e6cb; }
                    .warning { background-color: #fff3cd; border-color: #ffeaa7; }
                    .info { background-color: #d1ecf1; border-color: #bee5eb; }
                    .stat { font-size: 18px; font-weight: bold; color: #333; }
                </style>
            </head>
            <body>
                <h2>Reporte Diario</h2>
                <p><strong>Fecha de ejecución:</strong> ${new Date().toLocaleString()}</p>
                
                <div class="card info">
                    <h3>🗑️ Fechas eliminadas</h3>
                    <p class="stat">${nodosEliminados} fechas eliminadas</p>
                </div>
                
                <div class="card ${estado.includes('✅') ? 'success' : 'warning'}">
                    <h3>📅 Servicio del día</h3>
                    <p><strong>Fecha:</strong> ${fechaHoy}</p>
                    <p><strong>Servicio:</strong> ${servicioHoy}</p>
                    <p><strong>Estado:</strong> ${estado}</p>
                </div>
                
                <hr>
                <p><em>Este reporte fue generado automáticamente por el sistema de limpieza diaria.</em></p>
            </body>
            </html>
        `;

        await sendEmail(emailSubject, emailHtml);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        
        // Enviar email de error también
        const errorSubject = '❌ Error en Limpieza Diaria Neo4j';
        const errorHtml = `
            <h2>❌ Error en el proceso de limpieza</h2>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Error:</strong> ${error.message}</p>
        `;
        
        await sendEmail(errorSubject, errorHtml);
        process.exit(1);
    } finally {
        await session.close();
        await driver.close();
    }
}

dailyCleanup();