

"""
Domain specific language for DBpedia quepy.
"""

from quepy.dsl import FixedType, HasKeyword, FixedRelation, FixedDataRelation

# Setup the Keywords for this application
HasKeyword.relation = "rdfs:label"
HasKeyword.language = "en"


class IsPerson(FixedType):
    fixedtype = "foaf:Person"


class IsPlace(FixedType):
    fixedtype = "dbpedia:Place"


class IsCountry(FixedType):
    fixedtype = "dbpedia-owl:Country"



class IsTvShow(FixedType):
    fixedtype = "yago:Art102743547"


class IsMovie(FixedType):
    fixedtype = "dbpedia-owl:Film"


class HasShowName(FixedDataRelation):
    relation = "dbp:title"
    language = "en"


class HasName(FixedDataRelation):
    relation = "dbpprop:name"
    language = "en"


class DefinitionOf(FixedRelation):
    relation = "rdfs:comment"
    reverse = True


class LabelOf(FixedRelation):
    relation = "rdfs:label"
    reverse = True

class ProducedBy(FixedRelation):
    relation = "dbpedia-owl:producer"


class BirthDateOf(FixedRelation):
    relation = "dbo:birthDate"
    reverse = True
    language = "en"

class DeathDate(FixedRelation):
    relation = "dbo:deathDate"
    reverse = True
    language = "en"

class DeathPlace(FixedRelation):
    relation = "dbo:deathPlace"
    reverse = True
    language = "en"


class BirthPlaceOf(FixedRelation):
    relation = "dbo:birthPlace"
    reverse = True
    language = "en"

class AuthorOf(FixedRelation):
    relation = "dbpedia-owl:author"
    reverse = True

 
