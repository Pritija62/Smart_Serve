from itertools import combinations
from collections import defaultdict
from datetime import datetime, timedelta

class AprioriAnalyzer:
    """
    From-scratch Apriori algorithm implementation for market basket analysis.
    Discovers frequent itemsets and association rules from order transaction data.
    
    ALGORITHM OVERVIEW:
    ===================
    The Apriori algorithm finds patterns in customer purchase behavior by:
    1. Finding frequent itemsets (groups of items bought together)
    2. Generating association rules (if customer buys X, they likely buy Y)
    3. Computing metrics: support, confidence, lift
    
    TERMINOLOGY:
    - Support: How often an itemset appears (fraction of all transactions)
    - Confidence: P(Y|X) = Likelihood of buying Y given they buy X
    - Lift: How much more likely Y is bought when X is bought
    - Itemset: A group of items (e.g., {'Burger', 'Fries'})
    
    EXAMPLE:
    --------
    analyzer = AprioriAnalyzer(min_support=0.3, min_confidence=0.7)
    analyzer.load_transactions(orders)           # Load order data
    analyzer.find_frequent_itemsets()            # Find patterns
    analyzer.generate_association_rules()        # Generate rules
    
    # Result: Find that 80% of burger buyers also buy fries (confidence=0.8)
    recommendations = analyzer.predict_items(['Burger'])  # Returns: [{'item': 'Fries', 'confidence': 0.8, ...}]
    
    TEST COVERAGE:
    See tests/test_apriori.py for comprehensive test suite including:
    - Support calculation (single and multi-item)
    - Frequent itemset discovery at different support levels
    - Association rule generation with confidence/lift metrics
    - Real-world restaurant scenarios
    - Edge cases (empty data, high thresholds, large itemsets)
    
    PERFORMANCE:
    - Time: O(2^n) in worst case (exponential in number of unique items)
    - Space: O(n) for storing frequent itemsets
    - Practical: Fast for restaurant menus (typically <50 items), suitable for nightly batch analysis
    """
    def __init__(self, min_support=0.3, min_confidence=0.7):
        self.min_support = min_support
        self.min_confidence = min_confidence
        self.transactions = []
        self.frequent_itemsets = {}  # frozenset -> support value
        self.association_rules = []
    # ------------------------------------------------------------------
    # Data loading
    # ------------------------------------------------------------------
    def load_transactions(self, orders):
        """
        Build the transaction list from a queryset of Order objects.
        Each transaction is a frozenset of menu-item name strings.
        """
        self.transactions = []
        for order in orders:
            items = frozenset(
                oi.menu_item.name
                for oi in order.order_items
                if oi.menu_item is not None
            )
            if items:
                self.transactions.append(items)
        return self.transactions
    # ------------------------------------------------------------------
    # Support calculation
    # ------------------------------------------------------------------
    def get_support(self, itemset):
        """Return the fraction of transactions that contain *itemset*."""
        if not self.transactions:
            return 0.0
        count = sum(1 for t in self.transactions if itemset.issubset(t))
        return count / len(self.transactions)
    # ------------------------------------------------------------------
    # Candidate generation (Apriori join step)
    # ------------------------------------------------------------------
    def generate_candidate_itemsets(self, frequent_itemsets_k, k):
        """
        Generate size-*k* candidate itemsets by joining two size-(k-1) frequent
        itemsets that share the same first (k-2) items (canonical Apriori join).
        """
        candidates = set()
        frequent_list = list(frequent_itemsets_k)
        for i, itemset_a in enumerate(frequent_list):
            for itemset_b in frequent_list[i + 1:]:
                union = itemset_a | itemset_b
                if len(union) == k:
                    candidates.add(union)
        return candidates
    # ------------------------------------------------------------------
    # Core Apriori – frequent itemset discovery
    # ------------------------------------------------------------------
    def find_frequent_itemsets(self):
        """
        Iteratively find all frequent itemsets using the Apriori algorithm.
        Returns a dict mapping frozenset -> support value.
        """
        self.frequent_itemsets = {}
        if not self.transactions:
            return self.frequent_itemsets
        # --- Level 1: single-item frequent itemsets ---
        item_counts = defaultdict(int)
        for transaction in self.transactions:
            for item in transaction:
                item_counts[frozenset([item])] += 1
        total = len(self.transactions)
        frequent_k = {
            itemset: count / total
            for itemset, count in item_counts.items()
            if count / total >= self.min_support
        }
        self.frequent_itemsets.update(frequent_k)
        k = 2
        while frequent_k:
            candidates = self.generate_candidate_itemsets(set(frequent_k.keys()), k)
            candidate_counts = defaultdict(int)
            for transaction in self.transactions:
                for candidate in candidates:
                    if candidate.issubset(transaction):
                        candidate_counts[candidate] += 1
            frequent_k = {
                itemset: count / total
                for itemset, count in candidate_counts.items()
                if count / total >= self.min_support
            }
            self.frequent_itemsets.update(frequent_k)
            k += 1
        return self.frequent_itemsets
    # ------------------------------------------------------------------
    # Association rule generation
    # ------------------------------------------------------------------
    def generate_association_rules(self):
        """
        Generate association rules from all frequent itemsets of size >= 2.
        A rule A → B is included when confidence(A → B) >= min_confidence.
        Lift = support(A ∪ B) / (support(A) * support(B)).
        """
        self.association_rules = []
        for itemset, itemset_support in self.frequent_itemsets.items():
            if len(itemset) < 2:
                continue
            items = list(itemset)
            # Try every non-empty proper subset as the antecedent
            for size in range(1, len(items)):
                for antecedent_items in combinations(items, size):
                    antecedent = frozenset(antecedent_items)
                    consequent = itemset - antecedent
                    antecedent_support = self.frequent_itemsets.get(antecedent)
                    if antecedent_support is None:
                        antecedent_support = self.get_support(antecedent)
                    if antecedent_support == 0:
                        continue
                    confidence = itemset_support / antecedent_support
                    if confidence < self.min_confidence:
                        continue
                    consequent_support = self.frequent_itemsets.get(consequent)
                    if consequent_support is None:
                        consequent_support = self.get_support(consequent)
                    lift = (
                        itemset_support / (antecedent_support * consequent_support)
                        if consequent_support > 0
                        else 0.0
                    )
                    self.association_rules.append({
                        'antecedent': sorted(antecedent),
                        'consequent': sorted(consequent),
                        'support': round(itemset_support, 4),
                        'confidence': round(confidence, 4),
                        'lift': round(lift, 4),
                    })
        # Sort by confidence descending, then lift descending
        self.association_rules.sort(
            key=lambda r: (r['confidence'], r['lift']),
            reverse=True,
        )
        return self.association_rules
    # ------------------------------------------------------------------
    # End-to-end analysis
    # ------------------------------------------------------------------
    def run_analysis(self, orders):
        """
        Full pipeline: load → find frequent itemsets → generate rules.
        Returns a summary dict ready for JSON serialisation.
        """
        self.load_transactions(orders)
        self.find_frequent_itemsets()
        self.generate_association_rules()
        # Group frequent itemsets by size
        itemsets_by_size = defaultdict(list)
        for itemset, support in self.frequent_itemsets.items():
            size = len(itemset)
            itemsets_by_size[size].append({
                'items': sorted(itemset),
                'support': round(support, 4),
            })
        # Sort within each size by support descending
        for size in itemsets_by_size:
            itemsets_by_size[size].sort(key=lambda x: x['support'], reverse=True)
        return {
            'total_transactions': len(self.transactions),
            'min_support': self.min_support,
            'min_confidence': self.min_confidence,
            'frequent_itemsets': dict(itemsets_by_size),
            'association_rules': self.association_rules,
            'total_rules': len(self.association_rules),
        }
    # ------------------------------------------------------------------
    # Convenience helpers
    # ------------------------------------------------------------------
    def get_top_rules(self, n=15):
        """Return the top *n* rules ordered by confidence then lift."""
        return self.association_rules[:n]
    def predict_items(self, current_items):
        """
        Recommend items that a customer might add to their cart given
        *current_items* (list of item name strings).
        Returns a list of {'item': str, 'confidence': float, 'lift': float}
        dicts, sorted by confidence descending.
        """
        current_set = set(current_items)
        recommendations = {}
        for rule in self.association_rules:
            antecedent = set(rule['antecedent'])
            # Antecedent must be a subset of the current cart
            if not antecedent.issubset(current_set):
                continue
            for item in rule['consequent']:
                if item not in current_set:
                    # Keep the highest-confidence recommendation per item
                    if item not in recommendations or rule['confidence'] > recommendations[item]['confidence']:
                        recommendations[item] = {
                            'item': item,
                            'confidence': rule['confidence'],
                            'lift': rule['lift'],
                        }
        return sorted(recommendations.values(), key=lambda x: x['confidence'], reverse=True)
