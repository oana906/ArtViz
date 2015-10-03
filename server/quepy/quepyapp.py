# coding: utf-8

# Copyright (c) 2012, Machinalis S.R.L.
# This file is part of quepy and is distributed under the Modified BSD License.
# You should have received a copy of license in the LICENSE file.
#
# Authors: Rafael Carrascosa <rcarrascosa@machinalis.com>
#          Gonzalo Garcia Berrotaran <ggarcia@machinalis.com>

"""
Implements the Quepy Application API
"""

import logging
import sys
import settings
import generation
import parsing
import tagger
import encodingpolicy
reload(sys)
sys.setdefaultencoding("utf-8")
from importlib import import_module
from types import ModuleType
from Model import ReturnModel
#from quepy import settings
#from quepy import generation
#from quepy.parsing import QuestionTemplate
from parsing import QuestionTemplate
from tagger import get_tagger, TaggingError
from encodingpolicy import encoding_flexible_conversion
from expression import Expression

logger = logging.getLogger("quepy.quepyapp")


def install(app_name):
    """
    Installs the application and gives an QuepyApp object
    """
    print sys.modules

    """freebase"""

    if 'freebase' in sys.modules:
        del sys.modules['freebase']
    if 'freebase.basic' in sys.modules:
        del sys.modules['freebase.basic']
    if 'freebase.country' in sys.modules:
        del sys.modules['freebase.country']
    if 'freebase.tvshows' in sys.modules:
        del sys.modules['freebase.tvshows']
    if 'freebase.people' in sys.modules:
        del sys.modules['freebase.people']
    if 'freebase.settings' in sys.modules:
        del sys.modules['freebase.settings']
    if 'freebase.music' in sys.modules:
        del sys.modules['freebase.music']
    if 'freebase.dsl' in sys.modules:
        del sys.modules['freebase.dsl']
    if 'freebase.movies' in sys.modules:
        del sys.modules['freebase.movies']
    if 'freebase.writers' in sys.modules:
        del sys.modules['freebase.writers']

    """dbpedia"""

    if 'dbpedia' in sys.modules:
        del sys.modules['dbpedia']
    if 'dbpedia.basic' in sys.modules:
        del sys.modules['dbpedia.basic']
    if 'dbpedia.country' in sys.modules:
        del sys.modules['dbpedia.country']
    if 'dbpedia.tvshows' in sys.modules:
        del sys.modules['dbpedia.tvshows']
    if 'dbpedia.people' in sys.modules:
        del sys.modules['dbpedia.people']
    if 'dbpedia.settings' in sys.modules:
        del sys.modules['dbpedia.settings']
    if 'dbpedia.music' in sys.modules:
        del sys.modules['dbpedia.music']
    if 'dbpedia.dsl' in sys.modules:
        del sys.modules['dbpedia.dsl']
    if 'dbpedia.movies' in sys.modules:
        del sys.modules['dbpedia.movies']
    if 'dbpedia.writers' in sys.modules:
        del sys.modules['dbpedia.writers']

    print sys.modules

    module_paths = {
        u"settings": u"{0}.settings",
        u"parsing": u"{0}",
    }
    modules = {}

    for module_name, module_path in module_paths.iteritems():
        try:
            modules[module_name] = import_module(module_path.format(app_name))
        except ImportError, error:
            message = u"Error importing {0!r}: {1}"
            raise ImportError(message.format(module_name, error))
    print modules
    return QuepyApp(**modules)

def delete_module(modname, paranoid=None):
    from sys import modules
    try:
        thismod = modules[modname]
    except KeyError:
        raise ValueError(modname)
    these_symbols = dir(thismod)
    if paranoid:
        try:
            paranoid[:]  # sequence support
        except:
            raise ValueError('must supply a finite list for paranoid')
        else:
            these_symbols = paranoid[:]
    del modules[modname]
    for mod in modules.values():
        try:
            delattr(mod, modname)
        except AttributeError:
            pass
        if paranoid:
            for symbol in these_symbols:
                if symbol[:2] == '__':  # ignore special symbols
                    continue
                try:
                    delattr(mod, symbol)
                except AttributeError:
                    pass

def question_sanitize(question):
    question = question.replace("'", "\'")
    question = question.replace("\"", "\\\"")
    return question


def _new_query_string(split_query, insert_text, i, j):
    query = ""
    index = 0
    only_once = True
    for o in split_query:
        if index < i or index >= j:
            query += " "+o
        elif only_once:
            query += insert_text
            only_once = False
        index += 1
    return query


class QuepyApp(object):
    """
    Provides the quepy application API.
    """

    def __init__(self, parsing, settings):
        """
        Creates the application based on `parsing`, `settings` modules.
        """

        assert isinstance(parsing, ModuleType)
        assert isinstance(settings, ModuleType)

        self._parsing_module = parsing
        self._settings_module = settings

        # Save the settings right after loading settings module
        self._save_settings_values()

        self.tagger = get_tagger()
        self.language = getattr(self._settings_module, "LANGUAGE", None)
        if not self.language:
            raise ValueError("Missing configuration for language")

        self.rules = []
        for element in dir(self._parsing_module):
            element = getattr(self._parsing_module, element)

            try:
                if issubclass(element, QuestionTemplate) and \
                        element is not QuestionTemplate:

                    self.rules.append(element())
            except TypeError:
                continue

        self.rules.sort(key=lambda x: x.weight, reverse=True)

    def get_query(self, question):
        """
        Given `question` in natural language, it returns
        three things:

        - the target of the query in string format
        - the query
        - metadata given by the regex programmer (defaults to None)

        The query returned corresponds to the first regex that matches in
        weight order.
        """

        question = question_sanitize(question)
        for returnModel in self.get_queries(question):
            return returnModel
        return None, None, None

    def get_queries(self, question):
        """
        Given `question` in natural language, it returns
        :type self: object
        three things:

        - the target of the query in string format
        - the query
        - metadata given by the regex programmer (defaults to None)

        The queries returned corresponds to the regexes that match in
        weight order.
        """
        """
            parse the question so that we split it if it hase "or" or
            "and" in it
            *( maybe on  "," also  at a later date)
        """

        question = encoding_flexible_conversion(question)
        questions = question.split(" and ", (-1))
        expr = Expression()
        first_time = True
        index = 0
        #print questions
        toBeReturned = ReturnModel(None, None)
        for question in questions:
            for expression, userdata in self._iter_compiled_forms(question):
                if first_time:
                    #print expression.rule_used
                    toBeReturned.rule_used = expression.rule_used
                    #print userdata
                    """
                        -- it wont work for all the question or it will but we need more parrsing --
                        base on the type of the expression.rule_used
                        we can take actions to connect the next expressions
                        to the curent one if they are more
                    """
                    if len(questions) > (index + 1):
                        if expression.rule_used == "WhoAreChildrensOfQuestion":
                            print "**************=Next query=**************************"
                            temp_data = question.split(" ", (-1))
                            print temp_data
                            questions[index+1] = _new_query_string(temp_data, questions[index+1], userdata.i, userdata.j)
                            print(questions[index+1])

                    message = u"Interpretation {1}: {0}"
                    print(message.format(str(expression),
                                 expression.rule_used))
                    first_time = False
                    expr = expression
                    expr.rule_used = expression
                else:
                    """
                      will have to see if there is more to parse form question if there are mor conditions
                      in order to make the next question base on the first query !
                    """
                    expr += expression
        index += 1

        target, query = generation.get_code(expr, self.language)
        toBeReturned.query = query
        yield toBeReturned
        print(u"Query generated: {0}".format(query))

    def _iter_compiled_forms(self, question):
        """
        Returns all the compiled form of the question.
        """

        try:
            print(u" ****************************** \n")
            print self.tagger(question)
            print(u" ****************************** \n")
            words = list(self.tagger(question))
        except TaggingError:
            logger.warning(u"Can't parse tagger's output for: '%s'",
                           question)
            return

        print words

        for rule in self.rules:
            print rule
            expression, userdata = rule.get_interpretation(words)
            if expression:
                yield expression, userdata

    def _save_settings_values(self):
        """
        Persists the settings values of the app to the settings module
        so it can be accesible from another part of the software.
        """

        for key in dir(self._settings_module):
            if key.upper() == key:
                value = getattr(self._settings_module, key)
                if isinstance(value, str):
                    value = encoding_flexible_conversion(value)
                setattr(settings, key, value)
