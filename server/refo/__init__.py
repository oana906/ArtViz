
from .match import match, search, finditer
from .patterns import (
    Predicate, Any, Literal, Disjunction, Concatenation,
    Star, Plus, Question, Group, Repetition
)
# tedious means of satisfying flake8
assert match
assert search
assert finditer
assert Predicate
assert Any
assert Literal
assert Disjunction
assert Concatenation
assert Star
assert Plus
assert Question
assert Group
assert Repetition
