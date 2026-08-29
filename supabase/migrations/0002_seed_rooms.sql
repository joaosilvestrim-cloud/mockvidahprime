-- Seed das salas reais (idempotente)
insert into public.rooms (id, slug, name, category, description, price_hour, available, accent, icon, specialties, sort) values
 (1,'clinica-07','Sala Clínica 07','Clínica','Sala com maca para atendimentos clínicos, consultas, avaliações, procedimentos e terapias em saúde, bem-estar e estética.',55,true,'#14A08B','pulse','{"Clínica","Dermatologia","Nutrição","Estética","Acupuntura"}',1),
 (2,'clinica-09','Sala Clínica 09','Clínica','Sala versátil com maca para consultas, avaliações, procedimentos e atendimentos em saúde, bem-estar e estética.',55,true,'#E86B5E','pulse','{"Clínica","Fisioterapia","Enfermagem","Estética","Bem-estar"}',2),
 (3,'conecta-11','Sala Conecta 11','Conecta','Sala confortável para atendimentos individuais, avaliações e momentos de escuta e conexão.',40,true,'#4E4B8E','sofa','{"Psicologia","Nutrição","Fonoaudiologia","Terapias integrativas"}',3),
 (4,'odontologica','Sala Odontológica','Odontológica','Consultório odontológico completo, com cadeira, equipo, sugador, bomba a vácuo e ultrassom, para diversas especialidades e procedimentos.',70,true,'#26235E','tooth','{"Odontologia","Ortodontia","Implantodontia","Endodontia"}',4),
 (5,'meeting','Sala Meeting','Meeting','Espaço amplo e versátil para reuniões, palestras, treinamentos, dinâmicas, workshops e encontros profissionais.',120,true,'#1A1743','present','{"Reuniões","Palestras","Treinamentos","Workshops"}',5),
 (6,'conecta-12','Sala Conecta 12','Conecta','Mais uma Sala Conecta em preparação. Em breve, novo espaço para atendimentos individuais.',40,false,'#7B6FB0','sofa','{"Psicologia","Terapias","Nutrição"}',6)
on conflict (id) do update set
  name=excluded.name, category=excluded.category, description=excluded.description,
  price_hour=excluded.price_hour, available=excluded.available, accent=excluded.accent,
  icon=excluded.icon, specialties=excluded.specialties, sort=excluded.sort;
