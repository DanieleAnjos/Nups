const express = require('express');
const nodemailer = require('nodemailer');

require('dotenv').config();


const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  }

});

exports.renderContactPage = (req, res) => {
  res.render('contato'); 
};

exports.sendContactEmail = async (req, res) => {
  console.log('Dados recebidos:', req.body);

  const { nome, email, mensagem } = req.body;

  // Validação dos campos obrigatórios
  if (!nome || !email || !mensagem) {
      console.log('Erro: Campos obrigatórios não preenchidos.');
      req.flash('error_msg', 'Preencha todos os campos.');
      return res.redirect('/');
  }

  // Validação básica do formato do e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
      console.log('Erro: E-mail inválido.');
      req.flash('error_msg', 'Por favor, insira um e-mail válido.');
      return res.redirect('/');
  }

  try {
      const mailOptions = {
          from: `"${nome}" <${email}>`,
          to: 'daniele.lims02@gmail.com',
            subject: `📩 Novo Contato Recebido`,
            text: `
                Olá,
        
                Você recebeu uma nova mensagem de contato através do site.
        
                📌 Detalhes do remetente:
                -----------------------------------
                🔹 Nome: ${nome}
                🔹 E-mail: ${email}
        
                💬 Mensagem:
                -----------------------------------
                ${mensagem}
        
                📅 Data/Hora: ${new Date().toLocaleString()}
        
                Atenciosamente,
                [Nome do Seu Site]
            `,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px; background-color: #f9f9f9;">
                    <h2 style="color: #007bff; text-align: center;">📩 Novo Contato Recebido</h2>
                    <p style="font-size: 16px; color: #333;">Você recebeu uma nova mensagem através do site.</p>
                    
                    <hr style="border: 1px solid #ddd;">
                    
                    <h3 style="color: #444;">📌 Detalhes do Remetente</h3>
                    <p><strong>🔹 Nome:</strong> ${nome}</p>
                    <p><strong>📧 E-mail:</strong> <a href="mailto:${email}" style="color: #007bff;">${email}</a></p>
        
                    <hr style="border: 1px solid #ddd;">
        
                    <h3 style="color: #444;">💬 Mensagem</h3>
                    <p style="background: #fff; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">${mensagem}</p>
        
                    <hr style="border: 1px solid #ddd;">
        
                    <p style="font-size: 14px; color: #777; text-align: center;">
                        📅 <strong>Recebido em:</strong> ${new Date().toLocaleString()}
                    </p>
                </div>
            `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('E-mail enviado:', info.response);

      req.flash('success_msg', 'Mensagem enviada com sucesso!');
      return res.redirect('/');
  } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      req.flash('error_msg', 'Erro ao enviar o e-mail. Tente novamente.');
      return res.redirect('/');
  }
};
