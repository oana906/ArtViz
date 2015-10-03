class ReturnModel:
    def __init__(self, query, rule_used):
        self.rule_used = rule_used
        self.query = query

    def toJSON(self):
        return { 'query' :  self.query, 'rule' : self.rule_used }


class ReturnValue(object):
    def __init__(self, i, j):
        self.i = i
        self.j = j