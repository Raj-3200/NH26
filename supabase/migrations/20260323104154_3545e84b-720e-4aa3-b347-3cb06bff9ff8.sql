
CREATE TABLE public.admin_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read admin whitelist" ON public.admin_whitelist
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage whitelist" ON public.admin_whitelist
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.admin_whitelist (email, role) VALUES
  ('admin1@xyz.com', 'admin'),
  ('admin2@xyz.com', 'admin'),
  ('manager1@xyz.com', 'manager'),
  ('support1@xyz.com', 'support'),
  ('viewer1@xyz.com', 'viewer');
