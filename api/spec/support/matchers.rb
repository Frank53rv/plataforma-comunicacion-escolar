# Permite encadenar «cambia esto y no aquello» en una sola expectativa.
RSpec::Matchers.define_negated_matcher :not_change, :change
