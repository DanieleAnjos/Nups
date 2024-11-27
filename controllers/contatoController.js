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
  
    if (!nome || !email || !mensagem) {
      console.log('Erro: Campos obrigatórios não preenchidos.');
      return res.redirect('/Pagina_Inicial?error_msg=Preencha todos os campos.');
    }
  
    try {
      const mailOptions = {
        from: `"${nome}" <${email}>`,
        to: 'daniele.lims02@gmail.com',
        subject: 'Novo Contato do Site',
        text: `Você recebeu uma nova mensagem:\n\nNome: ${nome}\nE-mail: ${email}\nMensagem:\n${mensagem}`
      };
  
      const info = await transporter.sendMail(mailOptions);
      console.log('E-mail enviado:', info.response);
  
      return res.redirect('/Pagina_Inicial?success_msg=Mensagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      return res.redirect('/Pagina_Inicial?error_msg=Erro ao enviar o e-mail. Tente novamente.');
    }
};


  