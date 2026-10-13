-- RESET (solo desarrollo): borra el esquema core para re-ejecutar 0001 desde cero.
drop view if exists review_alerts;
drop function if exists assign_template(uuid, uuid);
drop table if exists assigned_diet_items, assigned_diets, template_items, diet_templates,
  foods, booking_tokens, appointments, subscriptions, plans, clients, nutritionists, profiles
  cascade;
